import { logger } from '../../logger.js';
import { graphConfig } from './config.js';
import { tokenStore } from './tokenStore.js';
import { parseRetryAfterMs, timeoutSignal } from './util.js';

const EXPIRY_BUFFER_MS = 60_000;
const MAX_CIRCUIT_COOLDOWN_MS = 30_000;
const REAUTH_CODES = new Set([
  'invalid_grant',
  'interaction_required',
  'consent_required',
  'login_required',
]);

export class GraphAuthError extends Error {
  constructor(code, status = 0, requiresReauth = false, details = {}) {
    super('Microsoft Graph authentication failed.');
    this.name = 'GraphAuthError';
    this.code = code;
    this.status = status;
    this.requiresReauth = requiresReauth;
    Object.assign(this, details);
  }
}

/**
 * Creates an isolated token service. The default singleton is used by the mail
 * provider; tests supply their own fetch, store and clock implementations.
 */
export function createTokenService({
  config = graphConfig,
  store = tokenStore,
  fetchImpl = (url, options) => globalThis.fetch(url, options),
  now = () => Date.now(),
  timeoutMs = 15_000,
} = {}) {
  let cachedToken = null;
  let refreshInFlight = null;
  let reauthRequired = false;
  let circuitOpenUntil = 0;
  let consecutiveTransientFailures = 0;

  function clearCircuit() {
    consecutiveTransientFailures = 0;
    circuitOpenUntil = 0;
  }

  function noteTransientFailure(status, retryAfterMs = null) {
    consecutiveTransientFailures += 1;
    const exponential = Math.min(
      1000 * 2 ** Math.min(consecutiveTransientFailures - 1, 5),
      MAX_CIRCUIT_COOLDOWN_MS
    );
    const delay =
      status === 429 && retryAfterMs !== null
        ? Math.min(Math.max(retryAfterMs, 0), 300_000)
        : exponential;
    circuitOpenUntil = Math.max(circuitOpenUntil, now() + delay);
  }

  async function refresh() {
    let currentRefreshToken;
    try {
      currentRefreshToken = await store.readRefreshToken();
    } catch (error) {
      throw new GraphAuthError('token_store_error', 0, false, {
        reason: error?.message || 'Token store unavailable',
      });
    }

    const startedAt = now();
    let response;
    try {
      response = await fetchImpl(config.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: config.clientId,
          grant_type: 'refresh_token',
          refresh_token: currentRefreshToken,
          scope: config.scope,
        }),
        signal: timeoutSignal(timeoutMs),
      });
    } catch {
      noteTransientFailure(0);
      throw new GraphAuthError('token_endpoint_unreachable', 0);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const code = data.error || 'token_endpoint_error';
      const requiresReauth = REAUTH_CODES.has(code);
      const retryAfterMs = parseRetryAfterMs(
        response.headers?.get?.('retry-after'),
        now()
      );

      if (requiresReauth) reauthRequired = true;
      else if (response.status === 429 || response.status >= 500) {
        noteTransientFailure(response.status, retryAfterMs);
      }

      logger.error('Microsoft Graph token exchange failed', {
        code,
        status: response.status,
        requiresReauth,
      });

      throw new GraphAuthError(code, response.status, requiresReauth, { retryAfterMs });
    }

    const expiresIn = Number(data.expires_in);
    if (typeof data.access_token !== 'string' || !data.access_token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new GraphAuthError('invalid_token_response', response.status);
    }

    if (data.refresh_token && data.refresh_token !== currentRefreshToken) {
      try {
        await store.writeRefreshToken(data.refresh_token);
      } catch (error) {
        throw new GraphAuthError('token_store_error', response.status, false, {
          reason: error?.message || 'Could not persist replacement refresh token',
        });
      }
    }

    cachedToken = {
      value: data.access_token,
      expiresAt: startedAt + expiresIn * 1000,
    };
    clearCircuit();

    logger.info('Microsoft Graph access token cached', {
      expiresInSeconds: expiresIn,
      rotated: Boolean(data.refresh_token && data.refresh_token !== currentRefreshToken),
    });

    return cachedToken.value;
  }

  async function getAccessToken() {
    if (reauthRequired) {
      throw new GraphAuthError('reauthentication_required', 401, true);
    }

    if (cachedToken && now() < cachedToken.expiresAt - EXPIRY_BUFFER_MS) {
      return cachedToken.value;
    }

    const remainingCooldown = Math.max(0, circuitOpenUntil - now());
    if (remainingCooldown > 0) {
      throw new GraphAuthError('temporarily_unavailable', 429, false, {
        retryAfterMs: remainingCooldown,
      });
    }

    if (!refreshInFlight) {
      refreshInFlight = refresh().finally(() => {
        refreshInFlight = null;
      });
    }

    return refreshInFlight;
  }

  function invalidateAccessToken(rejectedToken) {
    if (cachedToken?.value === rejectedToken) cachedToken = null;
  }

  function reset() {
    cachedToken = null;
    refreshInFlight = null;
    reauthRequired = false;
    clearCircuit();
  }

  return {
    getAccessToken,
    invalidateAccessToken,
    reset,
    get requiresReauth() {
      return reauthRequired;
    },
  };
}

export const tokenService = createTokenService();

/** Operator recovery helper. Restarting the process is the preferred reset. */
export function resetGraphAuthState() {
  tokenService.reset();
}
