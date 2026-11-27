import { logger } from '../logger.js';
import { supabaseAdmin } from '../services/supabaseAdmin.js';

function unauthorized(res, message = 'Authentication required.') {
  return res.status(401).json({ error: message });
}

export async function requireAdmin(req, res, next) {
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'The backend Supabase admin client is not configured.' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';

  if (!token) return unauthorized(res);

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return unauthorized(res, 'Your session is invalid or has expired.');

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('admin_profiles')
      .select('id, email, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      logger.error('Admin profile lookup failed', { error: profileError.message });
      return res.status(500).json({ error: 'Could not verify your admin account.' });
    }

    if (!profile) {
      return res.status(403).json({ error: 'This account is not an administrator.' });
    }

    req.admin = profile;
    return next();
  } catch (error) {
    logger.error('Admin authentication failed', { error: error?.message });
    return res.status(500).json({ error: 'Could not verify your admin session.' });
  }
}
