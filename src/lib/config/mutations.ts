"use client";

// Client-side CRUD for the user's configuration tables. RLS scopes every row
// to the signed-in user. Callers should `reload()` the ConfigProvider after.

import { createClient } from "@/lib/supabase/client";
import { normalize } from "@/lib/constants";

async function currentUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sem sessão");
  return user.id;
}

export function slugify(name: string): string {
  return (
    normalize(name)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cadeira"
  );
}

// ── Calendar / settings ─────────────────────────────────────────────
export async function saveCalendarId(examCalendarId: string | null) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("app_settings").upsert({
    user_id,
    exam_calendar_id: examCalendarId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Calendar that editable events are written to (null ⇒ Google 'primary').
export async function saveWriteCalendarId(writeCalendarId: string | null) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("app_settings").upsert({
    user_id,
    write_calendar_id: writeCalendarId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ── Drives / sources ────────────────────────────────────────────────
export async function addDrive(input: {
  name: string;
  provider?: "drive" | "github";
  folder_id?: string;
  resource_key?: string | null;
  repo_full?: string | null;
  git_ref?: string | null;
  color?: string;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("drives").insert({
    user_id,
    name: input.name,
    provider: input.provider ?? "drive",
    folder_id: input.folder_id ?? "",
    resource_key: input.resource_key ?? null,
    repo_full: input.repo_full ?? null,
    git_ref: input.git_ref ?? null,
    color: input.color ?? "#2383e2",
  });
  if (error) throw error;
}

export async function updateDrive(
  id: string,
  patch: { name?: string; folder_id?: string; resource_key?: string | null; color?: string },
) {
  const supabase = createClient();
  const { error } = await supabase.from("drives").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteDrive(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("drives").delete().eq("id", id);
  if (error) throw error;
}

// ── Subjects ────────────────────────────────────────────────────────
export async function addSubject(input: {
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  exam_match?: string[];
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("subjects").insert({
    user_id,
    name: input.name,
    slug: input.slug,
    color: input.color ?? "#2383e2",
    icon: input.icon ?? "📘",
    exam_match: input.exam_match ?? [],
  });
  if (error) throw error;
}

export async function updateSubject(
  id: string,
  patch: {
    name?: string;
    slug?: string;
    color?: string;
    icon?: string;
    exam_match?: string[];
  },
) {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSubject(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) throw error;
}

// ── Subject folders ─────────────────────────────────────────────────
export async function addSubjectFolder(input: {
  subject_id: string;
  drive_id?: string | null;
  provider?: "drive" | "github";
  folder_id: string;
  resource_key?: string | null;
  repo_full?: string | null;
  git_ref?: string | null;
  name?: string | null;
  source?: string;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("subject_folders").insert({
    user_id,
    subject_id: input.subject_id,
    drive_id: input.drive_id ?? null,
    provider: input.provider ?? "drive",
    folder_id: input.folder_id,
    resource_key: input.resource_key ?? null,
    repo_full: input.repo_full ?? null,
    git_ref: input.git_ref ?? null,
    name: input.name ?? null,
    source: input.source ?? "manual",
  });
  if (error) throw error;
}

export async function deleteSubjectFolder(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("subject_folders").delete().eq("id", id);
  if (error) throw error;
}

// ── Topics (tasks + milestones) ─────────────────────────────────────
export async function addTopic(input: {
  subject_id: string;
  title: string;
  description?: string | null;
  kind?: "task" | "milestone";
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("progress_topics").insert({
    user_id,
    subject_id: input.subject_id,
    title: input.title,
    description: input.description ?? null,
    kind: input.kind ?? "task",
  });
  if (error) throw error;
}

export async function updateTopic(
  id: string,
  patch: { title?: string; description?: string | null },
) {
  const supabase = createClient();
  const { error } = await supabase.from("progress_topics").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTopic(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("progress_topics").delete().eq("id", id);
  if (error) throw error;
}

// Deletes all topics for a subject, optionally only one kind.
export async function deleteTopicsForSubject(
  subjectId: string,
  kind?: "task" | "milestone",
) {
  const supabase = createClient();
  let query = supabase.from("progress_topics").delete().eq("subject_id", subjectId);
  if (kind) query = query.eq("kind", kind);
  const { error } = await query;
  if (error) throw error;
}

// ── AI credentials (IAedu) ──────────────────────────────────────────
// The key is written by the user (their own key, over HTTPS, RLS-scoped) and is
// never selected back to the client by the app. The channel id is not secret.
export async function saveAiCredentials(
  key: string | null,
  channelId: string | null,
) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const present = Boolean(key && key.trim());
  const { error } = await supabase.from("app_settings").upsert({
    user_id,
    ai_api_key: present ? key!.trim() : null,
    ai_channel_id: channelId && channelId.trim() ? channelId.trim() : null,
    ai_key_present: present,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ── Milestone → to-do (synced) ──────────────────────────────────────
// Creates a note linked to a milestone. Completion is kept in sync by DB
// triggers. No-op if the milestone is already on the to-do list.
export async function copyMilestoneToTodo(input: {
  topicId: string;
  title: string;
  subjectSlug?: string | null;
  description?: string | null;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();

  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("topic_id", input.topicId)
    .maybeSingle();
  if (existing) return;

  const { data: tp } = await supabase
    .from("topic_progress")
    .select("done")
    .eq("topic_id", input.topicId)
    .maybeSingle();
  const done = (tp as { done: boolean } | null)?.done ?? false;

  const { error } = await supabase.from("notes").insert({
    user_id,
    title: input.title,
    description: input.description ?? null,
    subject_slug: input.subjectSlug ?? null,
    topic_id: input.topicId,
    done,
  });
  if (error) throw error;
}
