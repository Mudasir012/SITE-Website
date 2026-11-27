import { createClient } from '@supabase/supabase-js';
import { config, isSupabaseAdminConfigured } from '../config.js';

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      'The backend Supabase admin client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  return supabaseAdmin;
}
