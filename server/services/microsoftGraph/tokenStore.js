import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { requireSupabaseAdmin } from '../supabaseAdmin.js';
import { graphConfig } from './config.js';

export const GRAPH_TOKEN_TABLE = 'microsoft_graph_token_store';
export const GRAPH_TOKEN_ROW_ID = 'default';

const ENCRYPTION_KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getEncryptionKey(env) {
  const raw = String(env.MS_GRAPH_TOKEN_ENCRYPTION_KEY || '').trim();
  if (!raw) {
    throw new Error('MS_GRAPH_TOKEN_ENCRYPTION_KEY is not configured.');
  }

  const key = Buffer.from(raw, 'base64');
  if (key.length !== ENCRYPTION_KEY_BYTES) {
    throw new Error('MS_GRAPH_TOKEN_ENCRYPTION_KEY must decode to 32 bytes.');
  }

  return key;
}

function fingerprint(value) {
  return createHash('sha256').update(value).digest('hex');
}

function encryptRefreshToken(value, key) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

  return JSON.stringify({
    v: 1,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: ciphertext.toString('base64'),
  });
}

function decryptRefreshToken(payload, key) {
  let envelope;
  try {
    envelope = JSON.parse(payload);
  } catch {
    throw new Error('Microsoft Graph token store contains invalid encrypted data.');
  }

  if (
    !envelope ||
    envelope.v !== 1 ||
    typeof envelope.iv !== 'string' ||
    typeof envelope.tag !== 'string' ||
    typeof envelope.data !== 'string'
  ) {
    throw new Error('Microsoft Graph token store contains invalid encrypted data.');
  }

  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const ciphertext = Buffer.from(envelope.data, 'base64');

  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES || !ciphertext.length) {
    throw new Error('Microsoft Graph token store contains invalid encrypted data.');
  }

  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  try {
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');

    if (!plaintext) {
      throw new Error('Microsoft Graph token store contains an empty refresh token.');
    }

    return plaintext;
  } catch {
    throw new Error('Microsoft Graph refresh token could not be decrypted.');
  }
}

/**
 * Supabase-backed refresh-token store.
 *
 * The token is encrypted with AES-256-GCM before it is written. The table has
 * RLS enabled with no anonymous/authenticated policies; only the backend
 * service-role client can read or write it. A fingerprint of the plaintext is
 * stored so a rotated token is only overwritten if it is still the token this
 * process read.
 */
export function createTokenStore({
  config = graphConfig,
  client = null,
  env = process.env,
  now = () => new Date(),
} = {}) {
  let expectedFingerprint = null;

  function getClient() {
    return client || requireSupabaseAdmin();
  }

  async function readRow() {
    const { data, error } = await getClient()
      .from(GRAPH_TOKEN_TABLE)
      .select('id, refresh_token_encrypted, token_fingerprint, sender_email')
      .eq('id', GRAPH_TOKEN_ROW_ID)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || 'Could not read the Microsoft Graph token store.');
    }

    return data || null;
  }

  async function writeRefreshToken(refreshToken) {
    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
      throw new Error('Invalid refresh token supplied to the Microsoft Graph token store.');
    }

    const key = getEncryptionKey(env);
    const nextFingerprint = fingerprint(refreshToken);
    const record = {
      id: GRAPH_TOKEN_ROW_ID,
      provider: 'microsoft_graph',
      sender_email: config.senderEmail || 'cite@cuiatd.edu.pk',
      refresh_token_encrypted: encryptRefreshToken(refreshToken, key),
      token_fingerprint: nextFingerprint,
      updated_at: now().toISOString(),
    };

    if (expectedFingerprint && expectedFingerprint !== nextFingerprint) {
      const { data, error } = await getClient()
        .from(GRAPH_TOKEN_TABLE)
        .update(record)
        .eq('id', GRAPH_TOKEN_ROW_ID)
        .eq('token_fingerprint', expectedFingerprint)
        .select('id');

      if (error) {
        throw new Error(error.message || 'Could not update the Microsoft Graph token store.');
      }

      if (!data || data.length === 0) {
        const current = await readRow();
        if (current?.token_fingerprint === nextFingerprint) {
          expectedFingerprint = nextFingerprint;
          return;
        }

        // Another process rotated the token between our read and this write.
        // Surface a typed conflict so the caller can adopt the persisted token
        // instead of failing the send. Treating this as a hard failure leaves
        // the row holding a token Microsoft may already have invalidated.
        const conflict = new Error(
          'Microsoft Graph refresh token changed during token exchange. Retry the token exchange.'
        );
        conflict.code = 'refresh_token_conflict';
        throw conflict;
      }

      expectedFingerprint = nextFingerprint;
      return;
    }

    const { error } = await getClient()
      .from(GRAPH_TOKEN_TABLE)
      .upsert(record, { onConflict: 'id' });

    if (error) {
      throw new Error(error.message || 'Could not write the Microsoft Graph token store.');
    }

    expectedFingerprint = nextFingerprint;
  }

  async function readRefreshToken() {
    const row = await readRow();

    if (!row) {
      const seed = String(env.MS_GRAPH_REFRESH_TOKEN || '').trim();
      if (!seed) {
        throw new Error(
          'Microsoft Graph token provisioning required. Insert the encrypted refresh token into public.microsoft_graph_token_store or set MS_GRAPH_REFRESH_TOKEN as a one-time bootstrap secret.'
        );
      }

      await writeRefreshToken(seed);
      return seed;
    }

    if (typeof row.refresh_token_encrypted !== 'string' || !row.refresh_token_encrypted) {
      throw new Error('Microsoft Graph token store row is invalid.');
    }

    const plaintext = decryptRefreshToken(row.refresh_token_encrypted, getEncryptionKey(env));
    expectedFingerprint = row.token_fingerprint || fingerprint(plaintext);
    return plaintext;
  }

  return { readRefreshToken, writeRefreshToken };
}

export const tokenStore = createTokenStore();
