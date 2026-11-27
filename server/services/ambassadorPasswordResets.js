import { config } from '../config.js';
import { logger } from '../logger.js';
import { normalizeEmail } from '../lib/validation.js';
import { emailService } from './email.js';
import { requireSupabaseAdmin } from './supabaseAdmin.js';
import { buildAmbassadorPasswordReset } from '../templates/ambassadorPasswordReset.js';

const AMBASSADOR_FIELDS = 'id, email, status, user_id, deleted_at';

async function findAmbassadorByEmail(email) {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin
    .from('ambassadors')
    .select(AMBASSADOR_FIELDS)
    .ilike('email', email)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw new Error('Could not look up the ambassador record.');
  return data || null;
}

/** Supabase Admin has no get-by-email helper, so search and match exactly. */
async function findAuthUserByEmail(email) {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
    search: email,
  });

  if (error) {
    logger.warn('Could not search Supabase Auth users by email',
      { error: error.message });
    return null;
  }

  return (
    (data?.users || []).find((user) => normalizeEmail(user.email) === email) || null
  );
}

/**
 * Email a one-time, app-domain password-reset link. The response is generic so
 * callers cannot use it to discover which ambassador emails exist.
 */
export async function requestAmbassadorPasswordReset({ email }) {
  const recipient = normalizeEmail(email);

  const ambassador = await findAmbassadorByEmail(recipient);
  const authUser = await findAuthUserByEmail(recipient);

  if (!ambassador || !authUser) {
    return { success: true };
  }

  const admin = requireSupabaseAdmin();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: recipient,
    options: { redirectTo: `${config.appUrl}/ambassador/setup?reset=1` },
  });

  if (error) {
    logger.error('Supabase recovery-link generation failed', {
      recipient,
      code: error.code,
      error: error.message,
    });
    throw new Error('Could not send the password reset email. Please try again.');
  }

  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) {
    logger.error('Supabase recovery response did not include a one-time token', {
      recipient,
    });
    throw new Error('Could not send the password reset email. Please try again.');
  }

  const actionLink = `${config.appUrl}/ambassador/setup?reset_token=${encodeURIComponent(tokenHash)}`;
  const template = buildAmbassadorPasswordReset({
    email: recipient,
    actionLink,
    appUrl: config.appUrl,
  });

  const delivery = await emailService.send({
    to: recipient,
    subject: template.subject,
    html: template.html,
    text: template.text,
    relatedType: 'ambassador',
    relatedId: ambassador.id,
    createdBy: null,
  });

  logger.info('Ambassador password reset email sent', {
    recipient,
    provider: delivery.provider,
    deliveryId: delivery.deliveryId,
  });

  return { success: true };
}
