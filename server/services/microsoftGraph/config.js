import { config, DEFAULT_GRAPH_SCOPE, getGraphConfigError } from '../../config.js';

export { getGraphConfigError };

export function buildGraphConfig(source = config) {
  const tenantId = (source.msGraphTenantId || '').trim();

  return Object.freeze({
    tenantId,
    clientId: (source.msGraphClientId || '').trim(),
    senderEmail: (source.msGraphSenderEmail || 'cite@cuiatd.edu.pk').trim(),
    scope: (source.msGraphScope || DEFAULT_GRAPH_SCOPE).trim(),
    tokenUrl: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    sendMailUrl: 'https://graph.microsoft.com/v1.0/me/sendMail',
  });
}

export const graphConfig = buildGraphConfig();
