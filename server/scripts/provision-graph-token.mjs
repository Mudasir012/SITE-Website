import { getGraphConfigError } from '../config.js';
import { tokenStore } from '../services/microsoftGraph/tokenStore.js';

/**
 * Operator-only bootstrap helper. It encrypts MS_GRAPH_REFRESH_TOKEN into the
 * Supabase token row if no row exists, or verifies that the existing row can be
 * decrypted. It never contacts Microsoft Graph and never sends email.
 */
try {
  const configError = getGraphConfigError();
  if (configError) {
    throw new Error(`Microsoft Graph configuration is incomplete: ${configError}`);
  }

  await tokenStore.readRefreshToken();
  console.log('Microsoft Graph token store is ready in Supabase.');
  console.log('No token value was printed.');
} catch (error) {
  console.error(`Graph token provisioning failed: ${error?.message || error}`);
  process.exitCode = 1;
}
