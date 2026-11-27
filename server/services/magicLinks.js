import { config } from '../config.js';
import { logger } from '../logger.js';
import { normalizeEmail } from '../lib/validation.js';
import { requireSupabaseAdmin } from './supabaseAdmin.js';

/**
 * Create a first-time Supabase Auth invite. The backend receives a one-time
 * token hash and emails a direct `${APP_URL}/ambassador/setup?invite_token=...`
 * link. The token is sent only in the email, is never logged, and is never
 * returned to an untrusted client.
 */
export async function generateAmbassadorInviteLink(email) {
  const recipient = normalizeEmail(email);
  const admin = requireSupabaseAdmin();
  const redirectTo = `${config.appUrl}/ambassador/setup`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: recipient,
    options: { redirectTo },
  });

  if (error) {
    const message = error.message || '';
    logger.error('Supabase invite-link generation failed', {
      recipient,
      code: error.code,
      error: message,
    });

    if (/already|registered|exists/i.test(message)) {
      throw new Error(
        'A sign-in account already exists for this email. Ask the ambassador to sign in or reset their password.'
      );
    }

    throw new Error('Could not generate an invitation link. Please try again.');
  }

  const tokenHash = data?.properties?.hashed_token;
  const userId = data?.user?.id || null;

  if (!tokenHash) {
    logger.error('Supabase invite response did not include a one-time token', { recipient });
    throw new Error('Could not generate an invitation link. Please try again.');
  }

  // Use the app-domain link instead of Supabase's /auth/v1/verify redirect.
  // That redirect is dropped to the Supabase Site URL when the target is not
  // in the project's allow-list, which strands ambassadors on the home page.
  const actionLink = `${config.appUrl}/ambassador/setup?invite_token=${encodeURIComponent(tokenHash)}`;

  return { actionLink, userId };
}
