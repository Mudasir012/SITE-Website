-- CITE 2026 — durable Microsoft Graph refresh-token store
-- Run once in Supabase → SQL Editor. Safe to re-run.
--
-- The backend service-role client stores one encrypted refresh token row.
-- RLS is enabled with no anon/authenticated policies; only service_role can
-- read or write this table. The token is AES-256-GCM encrypted by the backend
-- using MS_GRAPH_TOKEN_ENCRYPTION_KEY before it reaches the database.

create table if not exists public.microsoft_graph_token_store (
  id text primary key default 'default',
  provider text not null default 'microsoft_graph'
    check (provider = 'microsoft_graph'),
  sender_email text not null default 'cite@cuiatd.edu.pk',
  refresh_token_encrypted text not null,
  token_fingerprint text not null
    check (token_fingerprint ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.microsoft_graph_token_store enable row level security;

-- No policies are created by design. RLS blocks anon and authenticated access;
-- the service role bypasses RLS for the backend token store.
revoke all on table public.microsoft_graph_token_store from public, anon, authenticated;
grant select, insert, update, delete on table public.microsoft_graph_token_store to service_role;

notify pgrst, 'reload schema';
