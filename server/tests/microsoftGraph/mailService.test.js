import assert from 'node:assert/strict';
import test from 'node:test';
import { createMailService } from '../../services/microsoftGraph/mailService.js';

const config = { sendMailUrl: 'https://graph.microsoft.com/v1.0/me/sendMail' };

function jsonResponse(status, data = {}, headers = {}) {
  return {
    status,
    json: async () => data,
    headers: {
      get: (name) => headers[String(name).toLowerCase()] ?? null,
    },
  };
}

function createTokens(...values) {
  const queue = [...values];
  const invalidated = [];
  let calls = 0;

  return {
    invalidated,
    get calls() {
      return calls;
    },
    async getAccessToken() {
      calls += 1;
      return queue.shift() ?? `token-${calls}`;
    },
    invalidateAccessToken(token) {
      invalidated.push(token);
    },
  };
}

test('submits plain-text mail and returns an accepted result, not a delivery claim', async () => {
  let request;
  const tokens = createTokens('access-token');
  const service = createMailService({
    config,
    tokens,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse(202, {}, { 'request-id': 'graph-request-1' });
    },
  });

  const result = await service.sendEmail({
    to: 'Ambassador@Example.com',
    subject: 'Invite',
    text: 'Complete your setup.',
  });

  assert.equal(result.accepted, true);
  assert.equal(result.status, 202);
  assert.equal(result.outcome, 'submitted');
  assert.equal(result.requestId, 'graph-request-1');
  assert.equal(result.providerMessageId, 'graph-request-1');

  assert.equal(request.url, config.sendMailUrl);
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer access-token');
  assert.equal(
    request.options.headers['client-request-id'],
    result.operationId
  );

  const body = JSON.parse(request.options.body);
  assert.equal(body.message.subject, 'Invite');
  assert.equal(body.message.body.contentType, 'Text');
  assert.equal(body.message.body.content, 'Complete your setup.');
  assert.equal(
    body.message.toRecipients[0].emailAddress.address,
    'ambassador@example.com'
  );
  assert.equal(body.saveToSentItems, true);
});

test('uses HTML content when available and normalizes CC/BCC recipients', async () => {
  let body;
  const service = createMailService({
    config,
    tokens: createTokens('access-token'),
    fetchImpl: async (_url, options) => {
      body = JSON.parse(options.body);
      return jsonResponse(202);
    },
  });

  await service.sendEmail({
    to: ['one@example.com', 'two@example.com'],
    cc: 'cc@example.com',
    bcc: ['bcc@example.com'],
    subject: 'HTML notice',
    html: '<p>Hello</p>',
    text: 'Hello',
  });

  assert.equal(body.message.body.contentType, 'HTML');
  assert.equal(body.message.body.content, '<p>Hello</p>');
  assert.deepEqual(
    body.message.ccRecipients.map((r) => r.emailAddress.address),
    ['cc@example.com']
  );
  assert.deepEqual(
    body.message.bccRecipients.map((r) => r.emailAddress.address),
    ['bcc@example.com']
  );
});

test('retries once after a 401 with a freshly acquired token', async () => {
  const tokens = createTokens('stale-token', 'fresh-token');
  let calls = 0;

  const service = createMailService({
    config,
    tokens,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? jsonResponse(401, { error: { code: 'InvalidAuthenticationToken' } })
        : jsonResponse(202, {}, { 'request-id': 'graph-request-2' });
    },
  });

  const result = await service.sendEmail({
    to: 'user@example.com',
    subject: 'Retry',
    text: 'Body',
  });

  assert.equal(result.status, 202);
  assert.equal(calls, 2);
  assert.deepEqual(tokens.invalidated, ['stale-token']);
});

test('maps throttling and ambiguous transport failures without blind retries', async () => {
  const throttled = createMailService({
    config,
    tokens: createTokens('access-token'),
    now: () => 1_000,
    fetchImpl: async () =>
      jsonResponse(429, { error: { code: 'TooManyRequests' } }, { 'retry-after': '2' }),
  });

  await assert.rejects(
    throttled.sendEmail({ to: 'user@example.com', subject: 'Hi', text: 'Body' }),
    (error) => {
      assert.equal(error.code, 'throttled');
      assert.equal(error.retryAfterMs, 2000);
      assert.equal(error.outcome, 'rejected');
      return true;
    }
  );

  let calls = 0;
  const ambiguous = createMailService({
    config,
    tokens: createTokens('access-token'),
    fetchImpl: async () => {
      calls += 1;
      throw new Error('network timeout');
    },
  });

  await assert.rejects(
    ambiguous.sendEmail({ to: 'user@example.com', subject: 'Hi', text: 'Body' }),
    (error) => {
      assert.equal(error.code, 'submission_outcome_unknown');
      assert.equal(error.outcome, 'unknown');
      return true;
    }
  );
  assert.equal(calls, 1);
});

test('retries a transient Exchange 400 and then succeeds', async () => {
  let calls = 0;
  const service = createMailService({
    config,
    tokens: createTokens('access-token'),
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? jsonResponse(400, {
            error: { code: 'ErrorMailboxStoreUnavailable', message: 'Mailbox unavailable' },
          })
        : jsonResponse(202, {}, { 'request-id': 'graph-request-3' });
    },
  });

  const result = await service.sendEmail({
    to: 'user@example.com',
    subject: 'Retry 400',
    text: 'Body',
  });

  assert.equal(result.status, 202);
  assert.equal(calls, 2);
});

test('does not retry a permanent 400 and keeps the Graph error code', async () => {
  let calls = 0;
  const service = createMailService({
    config,
    tokens: createTokens('access-token'),
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(400, {
        error: { code: 'ErrorInvalidRecipients', message: 'Invalid recipient' },
      });
    },
  });

  await assert.rejects(
    service.sendEmail({ to: 'user@example.com', subject: 'Hi', text: 'Body' }),
    (error) => {
      assert.equal(error.code, 'bad_request');
      assert.equal(error.status, 400);
      assert.equal(error.upstreamCode, 'ErrorInvalidRecipients');
      assert.equal(error.upstreamMessage, 'Invalid recipient');
      assert.equal(error.outcome, 'rejected');
      return true;
    }
  );

  // A permanent 400 must fail fast, not burn retries.
  assert.equal(calls, 1);
});

test('rejects malformed recipients and empty content before contacting Graph', async () => {
  let called = false;
  const service = createMailService({
    config,
    tokens: createTokens('access-token'),
    fetchImpl: async () => {
      called = true;
      return jsonResponse(202);
    },
  });

  await assert.rejects(
    service.sendEmail({ to: 'not-an-email', subject: 'Hi', text: 'Body' }),
    TypeError
  );
  await assert.rejects(
    service.sendEmail({ to: 'user@example.com', subject: 'Hi' }),
    TypeError
  );
  assert.equal(called, false);
});
