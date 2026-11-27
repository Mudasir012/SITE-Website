import { config } from '../config.js';
import { logger } from '../logger.js';
import { normalizeEmail } from '../lib/validation.js';
import { requireSupabaseAdmin } from './supabaseAdmin.js';

/**
 * Create a first-time Supabase Auth invite link. The ambassador follows it to
 * /ambassador/setup, where they set a password and submit their details. The
 * action link is returned only to the backend email service; it is never
 * logged or sent to an untrusted client.
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

  const actionLink = data?.properties?.action_link;
  const userId = data?.user?.id || null;

  if (!actionLink) {
    logger.error('Supabase invite response did not include an action link', { recipient });
    throw new Error('Could not generate an invitation link. Please try again.');
  }

  return { actionLink, userId };
}
