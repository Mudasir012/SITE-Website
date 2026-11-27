import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createTokenService,
  GraphAuthError,
} from '../../services/microsoftGraph/tokenService.js';

const config = {
  clientId: '90c11236-10cf-4d46-a53d-7b3900c61369',
  scope: 'https://graph.microsoft.com/Mail.Send offline_access',
  tokenUrl: 'https://login.microsoftonline.com/tenant/oauth2/v2.0/token',
};

function jsonResponse(status, data = {}, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    headers: {
      get: (name) => headers[String(name).toLowerCase()] ?? null,
    },
  };
}

function createStore(initialToken = 'initial-refresh-token') {
  let refreshToken = initialToken;
  const writes = [];

  return {
    writes,
    get current() {
      return refreshToken;
    },
    async readRefreshToken() {
      return refreshToken;
    },
    async writeRefreshToken(next) {
      writes.push(next);
      refreshToken = next;
    },
  };
}

test('deduplicates concurrent refreshes, caches by expires_in, and rotates the refresh token', async () => {
  let now = 0;
  let calls = 0;
  const store = createStore();

  const fetchImpl = async (url, options) => {
    calls += 1;
    assert.equal(url, config.tokenUrl);
    assert.equal(options.method, 'POST');

    const body = new URLSearchParams(options.body);
    assert.equal(body.get('grant_type'), 'refresh_token');
    assert.equal(body.get('client_id'), config.clientId);
    assert.equal(body.get('scope'), config.scope);
    assert.equal(
      body.get('refresh_token'),
      calls === 1 ? 'initial-refresh-token' : 'rotated-refresh-token'
    );

    return jsonResponse(200, {
      access_token: 'access-token-1',
      expires_in: 3600,
      refresh_token: 'rotated-refresh-token',
    });
  };

  const service = createTokenService({ config, store, fetchImpl, now: () => now });

  const [first, second] = await Promise.all([
    service.getAccessToken(),
    service.getAccessToken(),
  ]);

  assert.equal(first, 'access-token-1');
  assert.equal(second, 'access-token-1');
  assert.equal(calls, 1);
  assert.deepEqual(store.writes, ['rotated-refresh-token']);

  now = 3_500_000;
  assert.equal(await service.getAccessToken(), 'access-token-1');
  assert.equal(calls, 1);

  now = 3_600_000;
  assert.equal(await service.getAccessToken(), 'access-token-1');
  assert.equal(calls, 2);
});

test('a failed replacement-token write blocks publication of the access token', async () => {
  const store = createStore();
  store.writeRefreshToken = async () => {
    throw new Error('disk unavailable');
  };

  const service = createTokenService({
    config,
    store,
    fetchImpl: async () =>
      jsonResponse(200, {
        access_token: 'access-token-should-not-be-published',
        expires_in: 3600,
        refresh_token: 'rotated-refresh-token',
      }),
  });

  await assert.rejects(service.getAccessToken(), (error) => {
    assert.equal(error.code, 'token_store_error');
    return true;
  });
});

test('a concurrent rotation does not fail the send', async () => {
  const store = createStore();
  store.writeRefreshToken = async () => {
    const conflict = new Error('Microsoft Graph refresh token changed during token exchange.');
    conflict.code = 'refresh_token_conflict';
    throw conflict;
  };

  const service = createTokenService({
    config,
    store,
    fetchImpl: async () =>
      jsonResponse(200, {
        access_token: 'access-token-after-race',
        expires_in: 3600,
        refresh_token: 'rotated-refresh-token',
      }),
  });

  // Another lambda rotated the token first. Our access token is still valid,
  // so the send must proceed rather than surfacing a phantom email failure.
  assert.equal(await service.getAccessToken(), 'access-token-after-race');
});

test('invalid_grant stops further refresh attempts', async () => {
  let calls = 0;
  const service = createTokenService({
    config,
    store: createStore(),
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(400, { error: 'invalid_grant' });
    },
  });

  await assert.rejects(service.getAccessToken(), (error) => {
    assert.equal(error.code, 'invalid_grant');
    assert.equal(error.requiresReauth, true);
    return true;
  });

  assert.equal(service.requiresReauth, true);
  await assert.rejects(service.getAccessToken(), (error) => {
    assert.equal(error.code, 'reauthentication_required');
    return true;
  });
  assert.equal(calls, 1);
});

test('token endpoint throttling opens a short circuit', async () => {
  let now = 0;
  let calls = 0;
  const service = createTokenService({
    config,
    store: createStore(),
    now: () => now,
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(429, { error: 'slow_down' }, { 'retry-after': '1' });
    },
  });

  await assert.rejects(service.getAccessToken(), (error) => {
    assert.equal(error.code, 'slow_down');
    return true;
  });

  await assert.rejects(service.getAccessToken(), (error) => {
    assert.ok(error instanceof GraphAuthError);
    assert.equal(error.code, 'temporarily_unavailable');
    assert.equal(error.retryAfterMs, 1000);
    return true;
  });

  assert.equal(calls, 1);

  now = 1_001;
  await assert.rejects(service.getAccessToken());
  assert.equal(calls, 2);
});
