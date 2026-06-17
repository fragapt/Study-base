-- Base de Estudo — saved study library (AI-generated content).
-- Each row is one generated artefact (resumo / flashcards / quiz / mapa mental)
-- scoped to a subject and to the topics/documents it was generated from.

create table if not exists public.study_resources (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  kind       text not null,                 -- 'resumo'|'flashcards'|'quiz'|'mindmap'
  title      text not null,
  objective  text,                          -- the user's free-text purpose
  content    jsonb not null,                -- kind-specific payload
  sources    jsonb not null default '[]'::jsonb,  -- [{type:'topic'|'document', ...}]
  created_at timestamptz not null default now()
);
alter table public.study_resources enable row level security;
create policy "study_resources_owner_all" on public.study_resources
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists study_resources_subject_idx
  on public.study_resources (subject_id, kind, created_at desc);
