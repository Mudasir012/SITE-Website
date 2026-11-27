import { logger } from '../logger.js';
import { supabaseAdmin } from './supabaseAdmin.js';

/**
 * Server-side audit trail for admin actions performed through the backend.
 * Failure is logged but never hides the outcome of the original action.
 */
export async function recordAdminAudit({ actorEmail, action, entityType, entityId = null, details = {} }) {
  if (!supabaseAdmin) return;

  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      actor_email: actorEmail || 'admin@cite.org',
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : '',
      details,
    });

    if (error) throw error;
  } catch (error) {
    logger.warn('Could not persist backend admin audit log', {
      action,
      entityType,
      entityId,
      error: error?.message,
    });
  }
}
