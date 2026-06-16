-- Base de Estudo — per-user configuration
-- Moves drives, subjects, subject→folder maps, study topics and the exam
-- calendar out of app constants and into per-user tables. Every user gets an
-- exclusive, personalized profile. All tables are RLS-scoped to the owner.

-- ── Per-user app settings (calendar config + future prefs) ────────────
create table if not exists public.app_settings (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  exam_calendar_id text,
  updated_at       timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "app_settings_owner_all" on public.app_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Drives (public Drive folders the user browses) ────────────────────
create table if not exists public.drives (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null,
  folder_id    text not null,
  resource_key text,                      -- for legacy link-shared folders
  color        text not null default '#2383e2',
  position     double precision not null default extract(epoch from now()),
  created_at   timestamptz not null default now()
);
alter table public.drives enable row level security;
create policy "drives_owner_all" on public.drives
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists drives_user_idx on public.drives (user_id, position);

-- ── Subjects (cadeiras) ───────────────────────────────────────────────
create table if not exists public.subjects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  slug        text not null,
  name        text not null,
  color       text not null default '#2383e2',
  icon        text not null default '📘',
  exam_match  text[] not null default '{}',   -- keywords matching exam titles
  position    double precision not null default extract(epoch from now()),
  created_at  timestamptz not null default now(),
  unique (user_id, slug)
);
alter table public.subjects enable row level security;
create policy "subjects_owner_all" on public.subjects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists subjects_user_idx on public.subjects (user_id, position);

-- ── Subject → Drive folder mappings (Materiais) ───────────────────────
-- source ∈ {'manual','auto'}: 'auto' rows were suggested by name matching.
create table if not exists public.subject_folders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  drive_id     uuid references public.drives (id) on delete set null,
  folder_id    text not null,
  resource_key text,
  name         text,                       -- folder name at attach time
  source       text not null default 'manual',
  created_at   timestamptz not null default now()
);
alter table public.subject_folders enable row level security;
create policy "subject_folders_owner_all" on public.subject_folders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists subject_folders_subject_idx
  on public.subject_folders (subject_id);

-- ── Study topics (Progresso checklist), editable per subject ──────────
create table if not exists public.progress_topics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  subject_id  uuid not null references public.subjects (id) on delete cascade,
  title       text not null,
  description text,
  position    double precision not null default extract(epoch from now()),
  created_at  timestamptz not null default now()
);
alter table public.progress_topics enable row level security;
create policy "progress_topics_owner_all" on public.progress_topics
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists progress_topics_subject_idx
  on public.progress_topics (subject_id, position);

-- ── Topic completion (replaces the old `progress` table) ──────────────
create table if not exists public.topic_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic_id   uuid not null references public.progress_topics (id) on delete cascade,
  done       boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
alter table public.topic_progress enable row level security;
create policy "topic_progress_owner_all" on public.topic_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The old per-(user,subject_slug,topic_key) table is superseded by
-- topic_progress keyed on topic_id. Drop it (low-value checkbox state).
drop table if exists public.progress;

-- `notes` is intentionally unchanged: it keeps `subject_slug text`, now
-- resolved against the user's own `subjects` rows (slug unique per user).
