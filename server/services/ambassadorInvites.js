import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { normalizeEmail } from '../lib/validation.js';
import { recordAdminAudit } from './audit.js';
import { buildAmbassadorInvite } from '../templates/ambassadorInvite.js';
import { emailService } from './email.js';
import { generateAmbassadorInviteLink } from './magicLinks.js';
import { requireSupabaseAdmin } from './supabaseAdmin.js';

const AMBASSADOR_FIELDS =
  'id, full_name, email, phone, cnic, university, referral_code, status, user_id, portal_invited_at, signup_completed_at, deleted_at';

function newReferralCode() {
  return `CITE-${randomBytes(5).toString('hex').toUpperCase()}`;
}

export async function findAmbassadorById(id) {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin
    .from('ambassadors')
    .select(AMBASSADOR_FIELDS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error('Could not load the ambassador record.');
  if (!data || data.deleted_at) return null;
  return data;
}

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

async function findAdminProfileByEmail(email) {
  const admin = requireSupabaseAdmin();
  const { data, error } = await admin
    .from('admin_profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (error) throw new Error('Could not check admin accounts for this email.');
  return Boolean(data);
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
    logger.warn('Could not search Supabase Auth users by email', {
      error: error.message,
    });
    return null;
  }

  return (
    (data?.users || []).find((user) => normalizeEmail(user.email) === email) || null
  );
}

async function deleteAuthUser(userId, { required = true } = {}) {
  if (!userId) return;

  const admin = requireSupabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    logger.warn('Could not delete Supabase Auth user', { error: error.message });
    if (required) {
      throw new Error('Could not remove the existing sign-in account. Please try again.');
    }
  }
}

/**
 * Invite links create a Supabase Auth user immediately, even if the ambassador
 * never opens the email. Remove that user before creating a fresh invite so a
 * deleted or resent invitation does not leave an orphaned account behind.
 */
async function removeExistingInviteAuthUser({ email, existing }) {
  if (await findAdminProfileByEmail(email)) {
    throw new Error('That email belongs to an admin account. Use a different ambassador email.');
  }

  const userIds = new Set();
  if (existing?.user_id) userIds.add(existing.user_id);

  const authUser = await findAuthUserByEmail(email);
  if (authUser) userIds.add(authUser.id);

  for (const userId of userIds) {
    await deleteAuthUser(userId);
  }
}

async function insertInvitedAmbassador(email, adminEmail, userId) {
  const admin = requireSupabaseAdmin();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await admin
      .from('ambassadors')
      .insert({
        full_name: '',
        email,
        phone: '',
        university: '',
        referral_code: newReferralCode(),
        status: 'invited',
        user_id: userId,
        invited_by: adminEmail,
        portal_invited_at: new Date().toISOString(),
      })
      .select(AMBASSADOR_FIELDS)
      .single();

    if (!error) return data;
    if (error.code !== '23505' || attempt === 4) throw error;
  }

  throw new Error('Could not allocate a unique referral code.');
}

async function markInvited(ambassadorId, adminEmail, userId) {
  const admin = requireSupabaseAdmin();
  const { error } = await admin
    .from('ambassadors')
    .update({
      status: 'invited',
      user_id: userId,
      invited_by: adminEmail,
      portal_invited_at: new Date().toISOString(),
      signup_completed_at: null,
      reviewed_at: null,
      reviewed_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ambassadorId);

  if (error) throw error;
}

async function rollbackInvite({ ambassador, wasExisting, previous, userId }) {
  const admin = requireSupabaseAdmin();

  await deleteAuthUser(userId, { required: false });

  try {
    if (wasExisting) {
      await admin
        .from('ambassadors')
        .update({
          status: previous.status,
          portal_invited_at: previous.portal_invited_at,
          user_id: null,
          invited_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ambassador.id);
    } else {
      await admin.from('ambassadors').delete().eq('id', ambassador.id);
    }
  } catch (error) {
    logger.warn('Could not roll back ambassador invite record', {
      ambassadorId: ambassador.id,
      error: error?.message,
    });
  }
}

export async function inviteAmbassadorByEmail({ email, adminEmail = null }) {
  const recipient = normalizeEmail(email);

  const existing = await findAmbassadorByEmail(recipient);
  if (existing?.user_id && (existing.status !== 'invited' || existing.signup_completed_at)) {
    throw new Error('An account has already been created for this email. Manage it from the ambassador list.');
  }

  await removeExistingInviteAuthUser({ email: recipient, existing });

  // Generate the auth invite first so a failed link never leaves a stale
  // invitation row in the admin list.
  const { actionLink, userId } = await generateAmbassadorInviteLink(recipient);

  let ambassador;
  const wasExisting = Boolean(existing);
  const previous = existing
    ? { status: existing.status, portal_invited_at: existing.portal_invited_at }
    : null;

  try {
    if (wasExisting) {
      await markInvited(existing.id, adminEmail, userId);
      ambassador = await findAmbassadorById(existing.id);
    } else {
      ambassador = await insertInvitedAmbassador(recipient, adminEmail, userId);
    }
  } catch (error) {
    await deleteAuthUser(userId, { required: false });
    logger.error('Could not create ambassador invitation record', {
      recipient,
      error: error?.message,
    });
    throw new Error('Could not record the invitation. Please try again.');
  }

  const template = buildAmbassadorInvite({
    email: recipient,
    actionLink,
    appUrl: config.appUrl,
  });

  try {
    const delivery = await emailService.send({
      to: recipient,
      subject: template.subject,
      html: template.html,
      text: template.text,
      relatedType: 'ambassador',
      relatedId: ambassador.id,
      createdBy: adminEmail,
    });

    await recordAdminAudit({
      actorEmail: adminEmail,
      action: 'INVITE_AMBASSADOR',
      entityType: 'ambassador',
      entityId: ambassador.id,
      details: { email: recipient, provider: delivery.provider },
    });

    return {
      success: true,
      provider: delivery.provider,
      deliveryId: delivery.deliveryId,
      mock: Boolean(delivery.mock),
      recipient,
      ambassadorId: ambassador.id,
    };
  } catch (error) {
    await rollbackInvite({
      ambassador,
      wasExisting,
      previous,
      userId,
    });

    await recordAdminAudit({
      actorEmail: adminEmail,
      action: 'INVITE_AMBASSADOR_FAILED',
      entityType: 'ambassador',
      entityId: ambassador.id,
      details: { email: recipient, error: error?.message },
    });

    throw error;
  }
}

export async function deleteAmbassadorAccount({ id, adminEmail = null }) {
  const ambassador = await findAmbassadorById(id);

  if (!ambassador) {
    throw new Error('Ambassador account not found.');
  }

  const userIds = new Set();
  if (ambassador.user_id) userIds.add(ambassador.user_id);

  // Older invitations were created before the auth user id was stored on the
  // row. Clean up by email as well so re-inviting works for those records.
  const authUser = await findAuthUserByEmail(ambassador.email);
  if (authUser) userIds.add(authUser.id);

  for (const userId of userIds) {
    await deleteAuthUser(userId);
  }

  const admin = requireSupabaseAdmin();
  const { error } = await admin
    .from('ambassadors')
    .update({
      deleted_at: new Date().toISOString(),
      user_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw new Error('Could not remove the ambassador profile.');

  await recordAdminAudit({
    actorEmail: adminEmail,
    action: 'DELETE_AMBASSADOR_ACCOUNT',
    entityType: 'ambassador',
    entityId: id,
    details: {
      email: ambassador.email,
      full_name: ambassador.full_name,
      had_auth_account: userIds.size > 0,
    },
  });

  return { success: true, ambassadorId: id };
}
