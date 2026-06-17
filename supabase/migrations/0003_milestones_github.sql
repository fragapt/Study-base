-- Base de Estudo — smart milestones, milestone↔to-do sync, GitHub sources

-- ── Content sources gain a provider + GitHub locator ──────────────────
alter table public.drives
  add column if not exists provider  text not null default 'drive',  -- 'drive'|'github'
  add column if not exists repo_full text,                            -- 'owner/repo'
  add column if not exists git_ref   text;                            -- branch (nullable)

alter table public.subject_folders
  add column if not exists provider  text not null default 'drive',
  add column if not exists repo_full text,
  add column if not exists git_ref   text;  -- for github, folder_id holds the repo path

-- ── Milestone provenance ──────────────────────────────────────────────
alter table public.progress_topics
  add column if not exists source text not null default 'manual';  -- 'manual'|'auto'|'ai'

-- ── Link a to-do to a milestone (synced completion) ───────────────────
alter table public.notes
  add column if not exists topic_id uuid references public.progress_topics (id) on delete set null;
create unique index if not exists notes_topic_uniq
  on public.notes (user_id, topic_id) where topic_id is not null;

-- ── AI credentials (server-read only) + non-secret presence flag ──────
alter table public.app_settings
  add column if not exists ai_api_key     text,
  add column if not exists ai_model       text,
  add column if not exists ai_key_present boolean not null default false;

-- ── Bidirectional sync: topic_progress ↔ notes ────────────────────────
-- Recursion-guarded: each side only writes when the value actually differs,
-- so the mirrored write makes no change and the partner trigger does not loop.

create or replace function public.sync_topic_to_note()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notes n
     set done = NEW.done
   where n.topic_id = NEW.topic_id
     and n.done is distinct from NEW.done;
  return NEW;
end;
$$;

drop trigger if exists trg_topic_to_note on public.topic_progress;
create trigger trg_topic_to_note
  after insert or update of done on public.topic_progress
  for each row execute function public.sync_topic_to_note();

create or replace function public.sync_note_to_topic()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.topic_id is not null then
    insert into public.topic_progress (user_id, topic_id, done, updated_at)
    values (NEW.user_id, NEW.topic_id, NEW.done, now())
    on conflict (user_id, topic_id)
    do update set done = excluded.done, updated_at = now()
      where public.topic_progress.done is distinct from excluded.done;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_note_to_topic on public.notes;
create trigger trg_note_to_topic
  after insert or update of done on public.notes
  for each row execute function public.sync_note_to_topic();
