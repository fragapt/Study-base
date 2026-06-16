-- Base de Estudo — schema
-- Subjects, their Drive folders, and study topics are fixed app constants
-- (see src/lib/constants.ts). The database stores only mutable per-user data.
-- Every table is RLS-scoped to the owning user.

-- ── Notes / to-dos ────────────────────────────────────────────────────
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  subject_slug text,                       -- null = geral (no subject tag)
  title       text not null,
  description text,
  done        boolean not null default false,
  due_date    date,
  position    double precision not null default extract(epoch from now()),
  created_at  timestamptz not null default now()
);
alter table public.notes enable row level security;
create policy "notes_owner_all" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists notes_user_idx on public.notes (user_id, subject_slug);

-- ── Study-checklist completion ────────────────────────────────────────
-- One row per (user, subject, topic). topic_key = the topic title from constants.
create table if not exists public.progress (
  user_id      uuid not null references auth.users (id) on delete cascade,
  subject_slug text not null,
  topic_key    text not null,
  done         boolean not null default false,
  updated_at   timestamptz not null default now(),
  primary key (user_id, subject_slug, topic_key)
);
alter table public.progress enable row level security;
create policy "progress_owner_all" on public.progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Web-push subscriptions ────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
create policy "push_owner_all" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Sent-reminder dedupe ──────────────────────────────────────────────
-- offset_kind ∈ {'3d','1d','day'}; written by the cron job (service role).
create table if not exists public.sent_reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  exam_uid    text not null,
  offset_kind text not null,
  sent_at     timestamptz not null default now(),
  unique (user_id, exam_uid, offset_kind)
);
alter table public.sent_reminders enable row level security;
create policy "reminders_owner_all" on public.sent_reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
