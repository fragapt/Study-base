// Server-side loader for a user's configuration (drives, subjects, folder maps,
// study topics, calendar). Reads via the request-scoped Supabase client so RLS
// returns only the current user's rows.

import { createClient } from "@/lib/supabase/server";
import { HAS_SUPABASE } from "@/lib/env";
import { EMPTY_CONFIG, type UserConfig } from "@/lib/config/types";
import type {
  DriveRow,
  SubjectRow,
  SubjectFolderRow,
  ProgressTopicRow,
  AppSettingsRow,
} from "@/lib/supabase/types";

export async function loadUserConfig(): Promise<UserConfig> {
  if (!HAS_SUPABASE) return EMPTY_CONFIG;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY_CONFIG;

  const [drives, subjects, subjectFolders, topics, settings] = await Promise.all([
    supabase.from("drives").select("*").order("position", { ascending: true }),
    supabase.from("subjects").select("*").order("position", { ascending: true }),
    supabase.from("subject_folders").select("*"),
    supabase.from("progress_topics").select("*").order("position", { ascending: true }),
    supabase.from("app_settings").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    examCalendarId:
      (settings.data as AppSettingsRow | null)?.exam_calendar_id ?? null,
    drives: (drives.data as DriveRow[] | null) ?? [],
    subjects: (subjects.data as SubjectRow[] | null) ?? [],
    subjectFolders: (subjectFolders.data as SubjectFolderRow[] | null) ?? [],
    topics: (topics.data as ProgressTopicRow[] | null) ?? [],
  };
}
