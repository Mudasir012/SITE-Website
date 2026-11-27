import { randomUUID } from 'node:crypto';
import { isValidEmail, normalizeEmail } from '../../lib/validation.js';
import { graphConfig } from './config.js';
import { tokenService } from './tokenService.js';
import { parseRetryAfterMs, timeoutSignal } from './util.js';

export class GraphMailError extends Error {
  constructor(code, details = {}) {
    super('Microsoft Graph mail submission failed.');
    this.name = 'GraphMailError';
    this.code = code;
    Object.assign(this, details);
  }
}

function recipients(value = [], label = 'recipient') {
  const values = Array.isArray(value) ? value : [value];
  const cleaned = values
    .filter((item) => item !== null && item !== undefined && String(item).trim())
    .map((item) => normalizeEmail(item));

  if (cleaned.some((address) => !isValidEmail(address))) {
    throw new TypeError(`A valid ${label} email address is required.`);
  }

  return cleaned.map((address) => ({ emailAddress: { address } }));
}

function getRequestId(headers) {
  return (
    headers?.get?.('request-id') ||
    headers?.get?.('x-ms-request-id') ||
    null
  );
}

/**
 * Creates an isolated Graph mail transport. The default singleton is used by
 * the Express provider; tests inject fetch and token-service doubles.
 */
export function createMailService({
  config = graphConfig,
  tokens = tokenService,
  fetchImpl = (url, options) => globalThis.fetch(url, options),
  now = () => Date.now(),
  timeoutMs = 20_000,
} = {}) {
  async function sendEmail({ to, cc = [], bcc = [], subject, html, text }) {
    const toRecipients = recipients(to, 'recipient');
    const ccRecipients = recipients(cc, 'CC recipient');
    const bccRecipients = recipients(bcc, 'BCC recipient');
    const cleanSubject = String(subject || '').trim();
    const hasHtml = typeof html === 'string' && html.trim().length > 0;
    const hasText = typeof text === 'string' && text.trim().length > 0;

    if (!toRecipients.length) throw new TypeError('A recipient is required.');
    if (!cleanSubject) throw new TypeError('Subject is required.');
    if (cleanSubject.length > 200) throw new TypeError('Subject is too long.');
    if (!hasHtml && !hasText) throw new TypeError('Email content is required.');

    const body = {
      message: {
        subject: cleanSubject,
        body: {
          contentType: hasHtml ? 'HTML' : 'Text',
          content: hasHtml ? html : text,
        },
        toRecipients,
        ccRecipients,
        bccRecipients,
      },
      saveToSentItems: true,
    };

    const operationId = randomUUID();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const token = await tokens.getAccessToken();
      let response;

      try {
        response = await fetchImpl(config.sendMailUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'client-request-id': operationId,
            'return-client-request-id': 'true',
          },
          body: JSON.stringify(body),
          signal: timeoutSignal(timeoutMs),
        });
      } catch {
        // A timeout or network loss does not establish that mail was not sent.
        throw new GraphMailError('submission_outcome_unknown', {
          operationId,
          outcome: 'unknown',
        });
      }

      const requestId = getRequestId(response.headers);

      if (response.status === 202) {
        return {
          accepted: true,
          status: 202,
          operationId,
          requestId,
          providerMessageId: requestId || operationId,
          outcome: 'submitted',
        };
      }

      if (response.status === 401 && attempt === 0) {
        tokens.invalidateAccessToken(token);
        continue;
      }

      if (response.status === 429) {
        throw new GraphMailError('throttled', {
          status: 429,
          operationId,
          requestId,
          retryAfterMs: parseRetryAfterMs(response.headers?.get?.('retry-after'), now()),
          outcome: 'rejected',
        });
      }

      const data = await response.json().catch(() => ({}));
      const upstreamCode = data?.error?.code;
      const code =
        response.status === 403
          ? 'forbidden'
          : response.status === 400
            ? 'bad_request'
            : upstreamCode || 'send_mail_failed';

      throw new GraphMailError(code, {
        status: response.status,
        operationId,
        requestId,
        outcome: response.status >= 500 ? 'unknown' : 'rejected',
      });
    }

    throw new GraphMailError('authentication_retry_exhausted', {
      operationId,
      outcome: 'rejected',
    });
  }

  return { sendEmail };
}

export const mailService = createMailService();

/** Convenience wrapper used by Express business services. */
export function sendEmail(message) {
  return mailService.sendEmail(message);
}
