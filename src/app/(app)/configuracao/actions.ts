"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_TEMPLATE } from "@/lib/constants";
import type { DriveRow, SubjectRow } from "@/lib/supabase/types";

// Seeds the current user's profile from DEFAULT_TEMPLATE (the L.EM setup).
// Idempotent: does nothing if the user already has drives or subjects.
export async function importDefaultTemplate(): Promise<{
  ok: boolean;
  message: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sem sessão." };

  const [{ count: driveCount }, { count: subjectCount }] = await Promise.all([
    supabase.from("drives").select("id", { count: "exact", head: true }),
    supabase.from("subjects").select("id", { count: "exact", head: true }),
  ]);
  if ((driveCount ?? 0) > 0 || (subjectCount ?? 0) > 0) {
    return { ok: false, message: "Já tens configuração — importação ignorada." };
  }

  // Calendar
  await supabase.from("app_settings").upsert({
    user_id: user.id,
    exam_calendar_id: DEFAULT_TEMPLATE.examCalendarId,
  });

  // Drives → map template key → new row id
  const driveRows = DEFAULT_TEMPLATE.drives.map((d, i) => ({
    user_id: user.id,
    name: d.name,
    folder_id: d.folderId,
    resource_key: d.resourceKey ?? null,
    color: d.color,
    position: i,
  }));
  const { data: insertedDrives, error: driveErr } = await supabase
    .from("drives")
    .insert(driveRows)
    .select("id, name");
  if (driveErr) return { ok: false, message: driveErr.message };

  const driveIdByName = new Map<string, string>(
    (insertedDrives as Pick<DriveRow, "id" | "name">[]).map((r) => [r.name, r.id]),
  );
  const driveIdByKey = new Map<string, string>(
    DEFAULT_TEMPLATE.drives
      .map((d) => [d.key, driveIdByName.get(d.name)] as const)
      .filter((e): e is [string, string] => Boolean(e[1])),
  );

  // Subjects → map slug → new row id
  const subjectRows = DEFAULT_TEMPLATE.subjects.map((s, i) => ({
    user_id: user.id,
    slug: s.slug,
    name: s.name,
    color: s.color,
    icon: s.icon,
    exam_match: s.examMatch,
    position: i,
  }));
  const { data: insertedSubjects, error: subjErr } = await supabase
    .from("subjects")
    .insert(subjectRows)
    .select("id, slug");
  if (subjErr) return { ok: false, message: subjErr.message };

  const subjectIdBySlug = new Map<string, string>(
    (insertedSubjects as Pick<SubjectRow, "id" | "slug">[]).map((r) => [
      r.slug,
      r.id,
    ]),
  );

  // Subject folders + topics
  const folderRows = DEFAULT_TEMPLATE.subjects.flatMap((s) => {
    const subjectId = subjectIdBySlug.get(s.slug);
    if (!subjectId) return [];
    return s.folders.map((f) => ({
      user_id: user.id,
      subject_id: subjectId,
      drive_id: driveIdByKey.get(f.driveKey) ?? null,
      folder_id: f.folderId,
      resource_key: f.resourceKey ?? null,
      name: f.name ?? null,
      source: "manual",
    }));
  });
  const topicRows = DEFAULT_TEMPLATE.subjects.flatMap((s) => {
    const subjectId = subjectIdBySlug.get(s.slug);
    if (!subjectId) return [];
    return s.topics.map((t, i) => ({
      user_id: user.id,
      subject_id: subjectId,
      title: t.title,
      description: t.description,
      position: i,
    }));
  });

  const [{ error: folderErr }, { error: topicErr }] = await Promise.all([
    folderRows.length
      ? supabase.from("subject_folders").insert(folderRows)
      : Promise.resolve({ error: null }),
    topicRows.length
      ? supabase.from("progress_topics").insert(topicRows)
      : Promise.resolve({ error: null }),
  ]);
  if (folderErr) return { ok: false, message: folderErr.message };
  if (topicErr) return { ok: false, message: topicErr.message };

  return { ok: true, message: "Configuração de exemplo importada." };
}
