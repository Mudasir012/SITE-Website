# Microsoft 365 Email Setup — Delegated Microsoft Graph

The CITE backend sends transactional email through the university Microsoft 365
mailbox `cite@cuiatd.edu.pk` using **delegated** Microsoft Graph `Mail.Send`.

This is **not** an app-only/client-credentials integration. The Entra public
client has already been registered, user consent has already been completed, and
the refresh token was obtained previously with the device authorization flow.
Do not create another app registration, client secret, mailbox password, SMTP
configuration, or Azure subscription for this integration.

The refresh token is stored **in Supabase**, not in a local file:
`public.microsoft_graph_token_store` holds one backend-managed row. The token is
encrypted with AES-256-GCM before it is written. Only the Express service-role
client can read or write that row; browser clients have no access.

Until the encrypted token row is provisioned and `EMAIL_PROVIDER=graph` is set,
keep `EMAIL_PROVIDER=mock`. Mock mode writes messages to `server/.mail-outbox/`
and never sends real mail.

## Runtime flow

```text
Authorized Express operation
  -> reusable mail service
  -> cached access token, or refresh-token exchange with Entra
  -> read encrypted token row from Supabase
  -> persist a replacement refresh token if Microsoft returns one
  -> POST https://graph.microsoft.com/v1.0/me/sendMail
  -> HTTP 202 means accepted for submission, not delivered
  -> record the submission in email_deliveries
```

Device-code sign-in is only for initial provisioning or operator recovery. It is
never started by a public API request.

`/me/sendMail` uses the identity that completed consent. `MS_GRAPH_SENDER_EMAIL`
is an operational expectation, not a sender override. The backend does not
accept a user-controlled `from` address and does not impersonate another mailbox.

## 1. Apply the database migration

For a fresh project, `supabase/schema.sql` already includes the token-store
table. For an existing project, run:

```sql
-- supabase/microsoft-graph-token-store.sql
```

The table is deliberately minimal:

```text
public.microsoft_graph_token_store
  id                      text primary key -- always "default"
  provider                text             -- always "microsoft_graph"
  sender_email            text             -- operational metadata
  refresh_token_encrypted text             -- AES-256-GCM JSON envelope
  token_fingerprint       text             -- SHA-256 of plaintext, for safe rotation
  created_at              timestamptz
  updated_at              timestamptz
```

RLS is enabled and no anon/authenticated policies are created. Anonymous and
authenticated roles are revoked from the table. Service role is granted
`SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Never expose this table through an
API route or a `VITE_` variable.

## 2. Backend configuration

Create `.env` from `.env.example` and set:

```env
PORT=3001
APP_URL=http://localhost:5173

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

MS_GRAPH_TENANT_ID=75df096c-8b72-48e4-9b91-cbf79d87ee3a
MS_GRAPH_CLIENT_ID=90c11236-10cf-4d46-a53d-7b3900c61369
MS_GRAPH_SENDER_EMAIL=cite@cuiatd.edu.pk
MS_GRAPH_SCOPE="https://graph.microsoft.com/Mail.Send offline_access"

# Generate locally: node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
MS_GRAPH_TOKEN_ENCRYPTION_KEY=<base64-encoded-32-byte-key>

EMAIL_PROVIDER=graph
```

`SUPABASE_SERVICE_ROLE_KEY` is required because the token row is not readable by
frontend users. It must stay server-side.

`MS_GRAPH_REFRESH_TOKEN` is bootstrap-only. If the Supabase row does not exist,
the backend reads this value once, encrypts it, and inserts the row. To provision
the row without sending an email, set the bootstrap secret temporarily and run:

```powershell
npm run provision:graph-token
```

That operator-only script does not contact Microsoft Graph and prints no token
value. After provisioning, remove `MS_GRAPH_REFRESH_TOKEN` from the runtime
environment and restart. The Supabase row then takes precedence, and a missing
row fails closed rather than silently restoring an old token.

Never prefix any backend secret with `VITE_`. The browser bundle only receives
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the optional `VITE_API_BASE_URL`.

### Encryption key handling

`MS_GRAPH_TOKEN_ENCRYPTION_KEY` must be base64 for exactly 32 bytes. The backend
uses AES-256-GCM with a fresh random 12-byte IV for every write and stores an
authentication tag, so the database contains no plaintext refresh token.

Store the encryption key in your deployment secret manager. It is separate from
the Supabase service-role key. Losing it makes the existing row undecryptable and
requires an authorized interactive re-consent. Rotating it requires re-provisioning
the token row.

## 3. What the implementation does

- `server/services/microsoftGraph/config.js` validates tenant/client GUIDs,
  scope, Supabase admin configuration, and the encryption key when
  `EMAIL_PROVIDER=graph`.
- `tokenStore.js` reads the encrypted Supabase row, seeds it from
  `MS_GRAPH_REFRESH_TOKEN` only when the row is missing, and atomically persists
  Microsoft-issued rotations.
- A SHA-256 fingerprint of the plaintext token is stored with the row. When a
  rotation is written, the backend updates only if the row still has the
  fingerprint it read. A concurrent rotation causes a fail-closed error instead
  of silently overwriting a newer token.
- `tokenService.js` exchanges the refresh token with
  `POST https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token` using
  `URLSearchParams`, caches the access token in memory using the real
  `expires_in`, refreshes about 60 seconds before expiry, and deduplicates
  concurrent refreshes in one process.
- `mailService.js` posts to `/v1.0/me/sendMail`, accepts one or many recipients
  plus optional CC/BCC, sends HTML when provided and plain text otherwise, uses
  a stable `client-request-id`, and keeps tokens out of application logs.
- `server/services/emailProviders/graph.js` adapts that service to the existing
  `emailService.send()` call signature used by the ambassador invitation flow.
- Graph HTTP `202` is recorded as `email_deliveries.status = 'submitted'`, not
  `'sent'`, because Graph has only accepted the message for processing.

## 4. Submission and retry policy

| Result | Behavior |
| --- | --- |
| `202 Accepted` | Mark submitted. Do not resend automatically. |
| `401 Unauthorized` | Invalidate the rejected access token and retry once. |
| `403 Forbidden` | Stop and investigate consent/mailbox policy. Do not escalate permissions automatically. |
| `400 Bad Request` | Fix payload or configuration; no blind retry. |
| `429 Too Many Requests` | Fail with bounded `Retry-After`; queue a retry externally if needed. |
| `5xx`, timeout, network loss | Mark outcome unknown. Reconcile before retrying. |
| `invalid_grant` / `interaction_required` | Stop refresh loops; require authorized interactive recovery. |
| Token row or key failure | Fail closed and restore secure storage/configuration. |

Graph `sendMail` is not idempotent. The `client-request-id` is a correlation ID,
not an idempotency key. The backend deliberately does not retry ambiguous
submissions.

The in-process refresh lock only coordinates one Express process. For multiple
workers, containers, PM2 cluster mode, or replicas, use one dedicated mail
worker, or add distributed coordination around the token exchange. The row-level
fingerprint check prevents stale overwrites but does not by itself prevent two
processes from presenting the same refresh token simultaneously.

## 5. Operator recovery

If consent is removed, the token is revoked, or organizational policy requires
new sign-in:

1. An authorized operator repeats the device-code consent flow using the
   **existing** tenant ID and client ID.
2. Provision the new refresh token into `public.microsoft_graph_token_store`
   through the approved secret channel, or set `MS_GRAPH_REFRESH_TOKEN` as a
   one-time bootstrap value and restart once.
3. Restart the Express process (preferred), or call the internal
   `resetGraphAuthState()` helper from a controlled operator mechanism.
4. Do not print credentials in deployment logs.

The previously disclosed token should be considered exposed. Rotate/revoke it
through approved organizational procedures; note that revoking sessions can
affect other sign-ins and may require administrator assistance. This codebase
does not revoke tokens or change Entra permissions.

## 6. Local checks

Run the mocked test suite:

```powershell
npm test
```

The tests cover token exchange deduplication, `expires_in` caching, refresh-token
rotation, failed rotation persistence, reauth stop conditions, Supabase row
bootstrapping, encrypted-at-rest storage, stale-rotation protection, HTTP 202
submission, HTML/text selection, CC/BCC, one 401 retry, throttling, unknown
transport outcomes, and malformed input.

Start both processes:

```powershell
npm run dev
```

Then check:

```powershell
curl http://localhost:3001/api/health
curl http://localhost:3001/api/email/status
```

With `EMAIL_PROVIDER=mock`, use the admin portal to invite a test ambassador and
open the captured JSON in `server/.mail-outbox/` to complete setup locally.
Mock mode refuses to send in production unless
`ALLOW_MOCK_EMAIL_IN_PRODUCTION=true` is explicitly set for an isolated test.

## 7. Live validation checklist (to be performed by an authorized operator)

These checks require the provisioned token and an approved test mailbox; they
were **not** executed as part of the code change:

1. Confirm the received test email was sent from `cite@cuiatd.edu.pk`.
2. Bootstrap the Supabase row from the existing refresh token and verify token
   exchange without printing the token response.
3. Send a plain-text test and an HTML test to an approved recipient; confirm
   HTTP `202`, inbox receipt, and Sent Items.
4. Send several messages while a token is cached and confirm the token endpoint
   is not called for every message.
5. Simulate expiry and concurrent requests with mocked fetch/storage; verify one
   refresh per process, correct replacement-token persistence, and stale-write
   protection.
6. Restart after removing `MS_GRAPH_REFRESH_TOKEN` and confirm the encrypted
   Supabase row is used.
7. Mock 401, 403, 429, 5xx, timeout, revoked credentials, and token-store
   failure; verify the policy above. Do not revoke a live shared mailbox during
   a routine test.
8. Verify malformed recipients, authorized CC/BCC use, safe logging, rate limits,
   and absence of secrets from repository and client responses.
9. Confirm the ambassador invitation and admin email flows still work with no
   API-contract changes.

## 8. Production notes

- Keep the Express backend on HTTPS and run it under a least-privileged identity.
- Set `APP_URL` to the public site origin and `VITE_API_BASE_URL` only if the
  backend is not served behind the same domain/reverse proxy.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, `MS_GRAPH_TOKEN_ENCRYPTION_KEY`, and all
  Graph token state on the backend only.
- Monitor `email_deliveries`, `requiresReauth` in `/api/email/status`, and
  operator alerts for authentication failures or unknown submissions.
- Exchange Online and Microsoft Graph apply their own throttling and sending
  limits. Keep the existing application-level admin rate limit in place.
