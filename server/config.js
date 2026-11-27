import 'dotenv/config';
import path from 'node:path';
import { logger } from './logger.js';

const asBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ENCRYPTION_KEY_BYTES = 32;

export const DEFAULT_GRAPH_SCOPE = 'https://graph.microsoft.com/Mail.Send offline_access';

const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
const emailProvider = (process.env.EMAIL_PROVIDER || 'mock').toLowerCase();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  port: Number(process.env.PORT || 3001),
  appUrl,

  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',

  // Microsoft Graph delegated integration. These values are server-only. The
  // refresh token lives in Supabase, never in a local file or the frontend.
  msGraphTenantId: (process.env.MS_GRAPH_TENANT_ID || '').trim(),
  msGraphClientId: (process.env.MS_GRAPH_CLIENT_ID || '').trim(),
  msGraphSenderEmail: (process.env.MS_GRAPH_SENDER_EMAIL || 'cite@cuiatd.edu.pk').trim(),
  msGraphScope: (process.env.MS_GRAPH_SCOPE || DEFAULT_GRAPH_SCOPE).trim(),
  msGraphTokenEncryptionKey: (process.env.MS_GRAPH_TOKEN_ENCRYPTION_KEY || '').trim(),

  emailProvider: ['mock', 'graph'].includes(emailProvider) ? emailProvider : 'mock',
  allowMockInProduction: asBool(process.env.ALLOW_MOCK_EMAIL_IN_PRODUCTION, false),

  mockOutboxDir: path.resolve(process.cwd(), process.env.MOCK_EMAIL_OUTBOX_DIR || 'server/.mail-outbox'),
};

export const isSupabaseAdminConfigured = Boolean(
  config.supabaseUrl && config.supabaseServiceRoleKey
);

export const isGraphConfigured = Boolean(
  config.msGraphTenantId &&
    config.msGraphClientId &&
    config.msGraphSenderEmail &&
    config.msGraphScope &&
    config.msGraphTokenEncryptionKey &&
    isSupabaseAdminConfigured
);

/**
 * Validate delegated Graph configuration without reading or returning secrets.
 * The refresh token is stored encrypted in Supabase; the bootstrap secret and
 * encryption key are handled by the token store at runtime.
 */
export function getGraphConfigError(source = config) {
  if (!source.msGraphTenantId) return 'MS_GRAPH_TENANT_ID is missing.';
  if (!source.msGraphClientId) return 'MS_GRAPH_CLIENT_ID is missing.';
  if (!GUID_PATTERN.test(source.msGraphTenantId)) return 'MS_GRAPH_TENANT_ID is not a valid GUID.';
  if (!GUID_PATTERN.test(source.msGraphClientId)) return 'MS_GRAPH_CLIENT_ID is not a valid GUID.';
  if (!source.msGraphSenderEmail) return 'MS_GRAPH_SENDER_EMAIL is missing.';
  if (!source.msGraphScope) return 'MS_GRAPH_SCOPE is missing.';
  if (!source.supabaseUrl) return 'SUPABASE_URL is missing.';
  if (!source.supabaseServiceRoleKey) return 'SUPABASE_SERVICE_ROLE_KEY is missing.';
  if (!source.msGraphTokenEncryptionKey) return 'MS_GRAPH_TOKEN_ENCRYPTION_KEY is missing.';

  try {
    if (Buffer.from(source.msGraphTokenEncryptionKey, 'base64').length !== ENCRYPTION_KEY_BYTES) {
      return 'MS_GRAPH_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.';
    }
  } catch {
    return 'MS_GRAPH_TOKEN_ENCRYPTION_KEY must be valid base64.';
  }

  return null;
}

export function assertBackendConfiguration() {
  if (!isSupabaseAdminConfigured) {
    logger.warn(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Ambassador invitations and the Microsoft Graph token store will return 503 until it is configured.'
    );
  }

  if (config.emailProvider === 'graph') {
    const graphError = getGraphConfigError();
    if (graphError) {
      throw new Error(`EMAIL_PROVIDER=graph is not configured correctly: ${graphError}`);
    }
  }

  if (config.emailProvider === 'mock' && config.isProduction && !config.allowMockInProduction) {
    logger.warn(
      'EMAIL_PROVIDER=mock is active in production. The mock provider refuses to send or expose links; set EMAIL_PROVIDER=graph for real delivery.'
    );
  }
}
