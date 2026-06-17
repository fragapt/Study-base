-- Base de Estudo — distinguish study tasks from learning-path milestones.
-- 'task'      → an editable study-task checklist item (copyable to to-do).
-- 'milestone' → an ordered step in the learning path inferred from the materials.

alter table public.progress_topics
  add column if not exists kind text not null default 'task';

create index if not exists progress_topics_kind_idx
  on public.progress_topics (subject_id, kind, position);
