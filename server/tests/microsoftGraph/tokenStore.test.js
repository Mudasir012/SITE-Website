import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import {
  GRAPH_TOKEN_ROW_ID,
  GRAPH_TOKEN_TABLE,
  createTokenStore,
} from '../../services/microsoftGraph/tokenStore.js';

const ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
const CONFIG = { senderEmail: 'cite@cuiatd.edu.pk' };

function fingerprint(value) {
  return createHash('sha256').update(value).digest('hex');
}

function createFakeClient() {
  let row = null;

  return {
    get row() {
      return row ? { ...row } : null;
    },
    patchRow(patch) {
      row = { ...row, ...patch };
    },
    from(table) {
      assert.equal(table, GRAPH_TOKEN_TABLE);

      return {
        select() {
          const filters = {};
          return {
            eq(field, value) {
              filters[field] = value;
              return this;
            },
            async maybeSingle() {
              const matches = row &&
                Object.entries(filters).every(([key, value]) => row[key] === value);
              return { data: matches ? { ...row } : null, error: null };
            },
          };
        },
        upsert(record, options) {
          assert.equal(options.onConflict, 'id');
          row = { ...record };
          return Promise.resolve({ error: null });
        },
        update(record) {
          const filters = {};
          return {
            eq(field, value) {
              filters[field] = value;
              return this;
            },
            async select() {
              const matches = row &&
                Object.entries(filters).every(([key, value]) => row[key] === value);
              if (!matches) return { data: [], error: null };
              row = { ...row, ...record };
              return { data: [{ id: row.id }], error: null };
            },
          };
        },
      };
    },
  };
}

function createStore(client, extraEnv = {}) {
  return createTokenStore({
    config: CONFIG,
    client,
    env: { MS_GRAPH_TOKEN_ENCRYPTION_KEY: ENCRYPTION_KEY, ...extraEnv },
    now: () => new Date('2026-11-27T12:00:00.000Z'),
  });
}

test('fails closed when no row or bootstrap secret exists', async () => {
  const store = createStore(createFakeClient());
  await assert.rejects(store.readRefreshToken(), /token provisioning required/i);
});

test('seeds a row from the bootstrap secret, encrypts it, and reads rotations back', async () => {
  const client = createFakeClient();
  const bootstrapStore = createStore(client, {
    MS_GRAPH_REFRESH_TOKEN: 'bootstrap-token',
  });

  assert.equal(await bootstrapStore.readRefreshToken(), 'bootstrap-token');
  assert.equal(client.row.id, GRAPH_TOKEN_ROW_ID);
  assert.equal(client.row.token_fingerprint, fingerprint('bootstrap-token'));
  assert.ok(!JSON.stringify(client.row).includes('bootstrap-token'));

  const rotationStore = createStore(client);
  assert.equal(await rotationStore.readRefreshToken(), 'bootstrap-token');
  await rotationStore.writeRefreshToken('rotated-token');

  assert.equal(client.row.token_fingerprint, fingerprint('rotated-token'));
  assert.equal(await createStore(client).readRefreshToken(), 'rotated-token');
});

test('persisted row takes precedence over a stale bootstrap secret', async () => {
  const client = createFakeClient();
  await createStore(client, { MS_GRAPH_REFRESH_TOKEN: 'bootstrap-token' }).readRefreshToken();
  await createStore(client).writeRefreshToken('provisioned-token');

  const store = createStore(client, { MS_GRAPH_REFRESH_TOKEN: 'stale-bootstrap-token' });
  assert.equal(await store.readRefreshToken(), 'provisioned-token');
});

test('rejects tampered encrypted data', async () => {
  const client = createFakeClient();
  await createStore(client, { MS_GRAPH_REFRESH_TOKEN: 'bootstrap-token' }).readRefreshToken();
  client.patchRow({ refresh_token_encrypted: '{not valid json' });

  await assert.rejects(createStore(client).readRefreshToken(), /invalid encrypted data/i);
});

test('blocks a stale rotation when another process already replaced the token', async () => {
  const client = createFakeClient();
  await createStore(client, { MS_GRAPH_REFRESH_TOKEN: 'bootstrap-token' }).readRefreshToken();

  const first = createStore(client);
  const second = createStore(client);
  assert.equal(await first.readRefreshToken(), 'bootstrap-token');
  assert.equal(await second.readRefreshToken(), 'bootstrap-token');

  await second.writeRefreshToken('rotated-by-second');

  await assert.rejects(
    first.writeRefreshToken('rotated-by-first'),
    /changed during token exchange/i
  );
  assert.equal(await createStore(client).readRefreshToken(), 'rotated-by-second');
});

test('requires a valid 32-byte encryption key', async () => {
  const client = createFakeClient();
  await createStore(client, { MS_GRAPH_REFRESH_TOKEN: 'bootstrap-token' }).readRefreshToken();

  const store = createTokenStore({
    config: CONFIG,
    client,
    env: { MS_GRAPH_TOKEN_ENCRYPTION_KEY: Buffer.alloc(16).toString('base64') },
  });

  await assert.rejects(store.readRefreshToken(), /decode to 32 bytes/i);
});
