import { logger } from '../logger.js';
import { supabaseAdmin } from './supabaseAdmin.js';

export async function recordDelivery({
  recipient,
  subject,
  provider,
  status,
  errorMessage = null,
  relatedType = null,
  relatedId = null,
  createdBy = null,
}) {
  if (!supabaseAdmin) {
    logger.warn('Email delivery not persisted: Supabase admin client is not configured', {
      recipient,
      subject,
      status,
    });
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('email_deliveries')
      .insert({
        recipient,
        subject,
        provider,
        status,
        error_message: errorMessage ? String(errorMessage).slice(0, 2000) : null,
        related_type: relatedType,
        related_id: relatedId,
        created_by: createdBy,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    // Delivery logging must never replace the real delivery result.
    logger.warn('Could not persist email delivery record', {
      error: error?.message || 'Unknown persistence error',
      recipient,
      status,
    });
    return null;
  }
}
