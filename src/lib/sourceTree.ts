// Client-side, provider-aware browsing for content sources (Drive + GitHub).
// Both providers are normalised to the DriveFile shape so the tree/preview UI
// stays uniform.

import {
  DriveFile,
  FOLDER_MIME,
  folderTarget,
  mimeFromName,
  openInDriveUrl,
} from "./files";

export interface SourceRoot {
  provider: "drive" | "github";
  // drive
  folderId?: string;
  resourceKey?: string;
  // github
  repoFull?: string;
  gitRef?: string;
  path?: string;
}

interface GithubEntry {
  name: string;
  path: string;
  type: "dir" | "file" | "symlink" | "submodule";
  size: number;
  downloadUrl: string | null;
  htmlUrl: string | null;
  sha: string;
}

function githubToFile(root: SourceRoot, e: GithubEntry): DriveFile {
  return {
    id: `gh:${root.repoFull}@${root.gitRef ?? ""}:${e.path}`,
    name: e.name,
    mimeType: e.type === "dir" ? FOLDER_MIME : mimeFromName(e.name),
    provider: "github",
    repoFull: root.repoFull,
    gitRef: root.gitRef,
    path: e.path,
    downloadUrl: e.downloadUrl ?? undefined,
    htmlUrl: e.htmlUrl ?? undefined,
    size: e.size ? String(e.size) : undefined,
  };
}

// Lists the immediate children of a source root (Drive folder or GitHub path).
export async function fetchChildren(root: SourceRoot): Promise<DriveFile[]> {
  if (root.provider === "github") {
    const qs = new URLSearchParams({ repo: root.repoFull! });
    if (root.path) qs.set("path", root.path);
    if (root.gitRef) qs.set("ref", root.gitRef);
    const res = await fetch(`/api/github?${qs}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao carregar o repositório");
    return ((data.entries as GithubEntry[]) ?? []).map((e) =>
      githubToFile(root, e),
    );
  }
  const qs = new URLSearchParams({ folderId: root.folderId! });
  if (root.resourceKey) qs.set("resourceKey", root.resourceKey);
  const res = await fetch(`/api/drive?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao carregar a pasta");
  return ((data.files as DriveFile[]) ?? []).map((f) => ({
    ...f,
    provider: "drive" as const,
  }));
}

// If a node is a folder, returns the root needed to list its children.
export function nodeChildrenRoot(file: DriveFile): SourceRoot | null {
  if (file.provider === "github") {
    if (file.mimeType === FOLDER_MIME && file.path !== undefined) {
      return {
        provider: "github",
        repoFull: file.repoFull,
        gitRef: file.gitRef,
        path: file.path,
      };
    }
    return null;
  }
  const t = folderTarget(file);
  return t
    ? { provider: "drive", folderId: t.id, resourceKey: t.resourceKey }
    : null;
}

// External "open" link for a node.
export function externalUrl(file: DriveFile): string {
  if (file.provider === "github") return file.htmlUrl ?? "#";
  return openInDriveUrl(file);
}

// A persistable pointer to a folder, in the shape stored in `subject_folders`.
export interface FolderLocator {
  provider: "drive" | "github";
  folderId: string; // drive id OR github path ("" = repo root)
  resourceKey?: string;
  repoFull?: string;
  gitRef?: string;
}

function locatorFromRoot(root: SourceRoot): FolderLocator {
  if (root.provider === "github") {
    return {
      provider: "github",
      folderId: root.path ?? "",
      repoFull: root.repoFull,
      gitRef: root.gitRef,
    };
  }
  return {
    provider: "drive",
    folderId: root.folderId!,
    resourceKey: root.resourceKey,
  };
}

// Locator for a folder node (null if it is not a folder).
export function folderLocator(file: DriveFile): FolderLocator | null {
  const root = nodeChildrenRoot(file);
  return root ? locatorFromRoot(root) : null;
}

// Locator for the current root itself (used to "attach this folder").
export function rootLocator(root: SourceRoot): FolderLocator {
  return locatorFromRoot(root);
}

// Builds a SourceRoot from a stored `drives` row.
export function rootFromDrive(d: {
  provider?: string;
  folder_id: string;
  resource_key: string | null;
  repo_full: string | null;
  git_ref: string | null;
}): SourceRoot {
  if (d.provider === "github") {
    return {
      provider: "github",
      repoFull: d.repo_full ?? undefined,
      gitRef: d.git_ref ?? undefined,
      path: d.folder_id || undefined,
    };
  }
  return {
    provider: "drive",
    folderId: d.folder_id,
    resourceKey: d.resource_key ?? undefined,
  };
}

// Builds a SourceRoot from a stored `subject_folders` row.
export function rootFromSubjectFolder(f: {
  provider?: string;
  folder_id: string;
  resource_key: string | null;
  repo_full: string | null;
  git_ref: string | null;
}): SourceRoot {
  return rootFromDrive(f);
}
