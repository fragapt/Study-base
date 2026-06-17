// Shared (client-safe) shape of a user's configuration and pure helpers over it.
// No server-only imports here — used by both the server loader and the client
// ConfigProvider.

import type {
  DriveRow,
  SubjectRow,
  SubjectFolderRow,
  ProgressTopicRow,
} from "@/lib/supabase/types";

export interface UserConfig {
  examCalendarId: string | null;
  // Non-secret AI flags. The API key itself never reaches the client.
  aiKeyPresent: boolean;
  aiChannelId: string | null;
  drives: DriveRow[];
  subjects: SubjectRow[];
  subjectFolders: SubjectFolderRow[];
  topics: ProgressTopicRow[];
}

export const EMPTY_CONFIG: UserConfig = {
  examCalendarId: null,
  aiKeyPresent: false,
  aiChannelId: null,
  drives: [],
  subjects: [],
  subjectFolders: [],
  topics: [],
};

export function subjectBySlug(
  config: UserConfig,
  slug: string,
): SubjectRow | undefined {
  return config.subjects.find((s) => s.slug === slug);
}

export function driveById(
  config: UserConfig,
  id: string | null,
): DriveRow | undefined {
  if (!id) return undefined;
  return config.drives.find((d) => d.id === id);
}

export function foldersForSubject(
  config: UserConfig,
  subjectId: string,
): SubjectFolderRow[] {
  return config.subjectFolders.filter((f) => f.subject_id === subjectId);
}

export function topicsForSubject(
  config: UserConfig,
  subjectId: string,
): ProgressTopicRow[] {
  return config.topics.filter((t) => t.subject_id === subjectId);
}
