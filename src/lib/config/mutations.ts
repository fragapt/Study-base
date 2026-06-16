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

// ── Drives ──────────────────────────────────────────────────────────
export async function addDrive(input: {
  name: string;
  folder_id: string;
  resource_key?: string | null;
  color?: string;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("drives").insert({
    user_id,
    name: input.name,
    folder_id: input.folder_id,
    resource_key: input.resource_key ?? null,
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
  folder_id: string;
  resource_key?: string | null;
  name?: string | null;
  source?: string;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("subject_folders").insert({
    user_id,
    subject_id: input.subject_id,
    drive_id: input.drive_id ?? null,
    folder_id: input.folder_id,
    resource_key: input.resource_key ?? null,
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

// ── Topics ──────────────────────────────────────────────────────────
export async function addTopic(input: {
  subject_id: string;
  title: string;
  description?: string | null;
}) {
  const supabase = createClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("progress_topics").insert({
    user_id,
    subject_id: input.subject_id,
    title: input.title,
    description: input.description ?? null,
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
