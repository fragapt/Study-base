// Server-side: lists each attached folder's immediate children (Drive + GitHub)
// into material entries (folder/file names, for the prompt's table of contents)
// and readable file targets (for text extraction). Shared by the milestones
// generator and the study-content generator.

import "server-only";
import { listDriveFolder } from "@/lib/google";
import { listRepoContents } from "@/lib/github";
import { folderTarget, mimeFromName, type MaterialTarget } from "@/lib/files";
import type { MaterialEntry } from "@/lib/milestones";
import type { SubjectFolderRow } from "@/lib/supabase/types";

export interface Gathered {
  entries: MaterialEntry[];
  targets: MaterialTarget[];
}

export async function gatherFolders(
  folders: SubjectFolderRow[],
): Promise<Gathered> {
  const entries: MaterialEntry[] = [];
  const targets: MaterialTarget[] = [];

  for (const f of folders) {
    if (f.provider === "github") {
      let items;
      try {
        items = await listRepoContents(
          f.repo_full ?? "",
          f.folder_id,
          f.git_ref ?? undefined,
        );
      } catch {
        continue;
      }
      for (const it of items) {
        const isFolder = it.type === "dir";
        entries.push({ name: it.name, isFolder });
        if (!isFolder && it.downloadUrl) {
          targets.push({
            provider: "github",
            name: it.name,
            mimeType: mimeFromName(it.name),
            downloadUrl: it.downloadUrl,
          });
        }
      }
    } else {
      let files;
      try {
        files = await listDriveFolder(f.folder_id, f.resource_key ?? undefined);
      } catch {
        continue;
      }
      for (const file of files) {
        const isFolder = Boolean(folderTarget(file));
        entries.push({ name: file.name, isFolder });
        const isShortcut = file.mimeType.includes("shortcut");
        if (!isFolder && !isShortcut) {
          targets.push({
            provider: "drive",
            name: file.name,
            mimeType: file.mimeType,
            fileId: file.id,
            resourceKey: file.resourceKey,
          });
        }
      }
    }
  }
  return { entries, targets };
}
