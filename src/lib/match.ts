// Auto-matching of Drive folders to subjects by name/keyword. Pure + testable.

import { normalize } from "@/lib/constants";
import type { SubjectRow } from "@/lib/supabase/types";

export interface ScannedFolder {
  driveId: string;
  folderId: string;
  resourceKey?: string;
  name: string;
}

export interface FolderSuggestion extends ScannedFolder {
  subjectId: string;
}

// Tokens used to match a subject: its exam keywords plus words (≥4 chars) from
// its name — short connector words like "dos"/"de" are dropped to avoid noise.
export function subjectKeywords(subject: SubjectRow): string[] {
  const fromName = normalize(subject.name)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  const fromMatch = subject.exam_match.map(normalize).filter(Boolean);
  return Array.from(new Set([...fromMatch, ...fromName]));
}

export function folderMatchesSubject(
  folderName: string,
  subject: SubjectRow,
): boolean {
  const n = normalize(folderName);
  return subjectKeywords(subject).some((k) => n.includes(k));
}

// For each scanned folder, emit a suggestion per subject it matches.
export function suggestFolders(
  folders: ScannedFolder[],
  subjects: SubjectRow[],
): FolderSuggestion[] {
  const out: FolderSuggestion[] = [];
  for (const f of folders) {
    for (const s of subjects) {
      if (folderMatchesSubject(f.name, s)) {
        out.push({ ...f, subjectId: s.id });
      }
    }
  }
  return out;
}
