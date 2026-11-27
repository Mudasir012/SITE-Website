import { logger } from '../../logger.js';
import { mailService } from '../microsoftGraph/mailService.js';

function safeGraphError(error) {
  switch (error?.code) {
    case 'submission_outcome_unknown':
      return 'Microsoft 365 did not confirm whether the message was submitted. Check before retrying.';
    case 'authentication_retry_exhausted':
    case 'reauthentication_required':
    case 'invalid_grant':
    case 'interaction_required':
    case 'consent_required':
    case 'login_required':
      return 'Microsoft 365 re-authentication is required before email can be sent.';
    case 'token_store_error':
      return 'The Microsoft Graph token store is unavailable. Restore secure token storage.';
    case 'token_endpoint_unreachable':
    case 'temporarily_unavailable':
      return 'Microsoft 365 authentication is temporarily unavailable. Try again later.';
    case 'throttled':
      return 'Microsoft 365 rate-limited the email request. Try again later.';
    case 'forbidden':
      return 'Microsoft 365 denied Mail.Send for the authorized mailbox (403).';
    case 'bad_request':
      return error?.upstreamCode
        ? `Microsoft 365 rejected the email request (400 ${error.upstreamCode}).`
        : 'Microsoft 365 rejected the email request (400). Check the message configuration.';
    case 'invalid_token_response':
      return 'Microsoft 365 returned an unusable authentication response. Re-authenticate the mailbox.';
    case 'invalid_scope':
      return 'Microsoft 365 rejected the requested scope (invalid_scope). Check MS_GRAPH_SCOPE for stray quotes or extra values.';
    case 'unauthorized_client':
    case 'invalid_client':
      return 'Microsoft 365 rejected the client configuration. Check MS_GRAPH_CLIENT_ID and MS_GRAPH_TENANT_ID.';
    default:
      // Never report a non-mail failure as an email submission failure. Token
      // endpoint codes such as invalid_request or unauthorized_client land
      // here, and mislabelling them sends operators hunting the wrong problem.
      if (error?.status === 400 || error?.status === 401) {
        return `Microsoft 365 authentication failed${
          error?.code ? ` (${error.code})` : ''
        }. Re-authenticate the mailbox.`;
      }
      return `Microsoft 365 email submission failed${error?.status ? ` (${error.status})` : ''}.`;
  }
}

export const graphProvider = {
  name: 'graph',
  configured: true,

  async send({ to, subject, html, text }) {
    try {
      const result = await mailService.sendEmail({ to, subject, html, text });

      logger.info('Microsoft Graph mail submitted', {
        operationId: result.operationId,
        requestId: result.requestId,
        status: result.status,
        outcome: result.outcome,
      });

      return {
        providerMessageId: result.requestId || result.operationId,
        operationId: result.operationId,
        status: result.status,
        outcome: result.outcome,
      };
    } catch (error) {
      logger.error('Microsoft Graph mail submission failed', {
        code: error?.code,
        status: error?.status,
        operationId: error?.operationId,
        requestId: error?.requestId,
        outcome: error?.outcome,
        // Microsoft's own code/message, e.g. ErrorInvalidRecipients or
        // ErrorTooManyRecipients, is what makes a 400 actionable.
        graphCode: error?.upstreamCode,
        graphMessage: error?.upstreamMessage,
      });

      throw new Error(safeGraphError(error));
    }
  },
};
