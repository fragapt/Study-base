-- Base de Estudo — Google Calendar write access.
-- Stores the user's Google OAuth refresh token (encrypted at rest) so the app
-- can mint access tokens to read/write their calendar. RLS owner-only; the token
-- is read only by server code and never selected into the client config.

create table if not exists public.google_tokens (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  refresh_token_enc text not null,
  scope             text,
  updated_at        timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
create policy "google_tokens_owner_all" on public.google_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Which calendar editable events are written to ('primary' when null).
alter table public.app_settings
  add column if not exists write_calendar_id text;
