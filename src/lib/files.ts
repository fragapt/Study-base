// Client-safe helpers for source file display (no server imports). A "file" may
// come from Google Drive (default) or a GitHub repository.

export type Provider = "drive" | "github";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
  resourceKey?: string;
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
    targetResourceKey?: string;
  };
  // Provider tagging. Absent ⇒ "drive".
  provider?: Provider;
  // GitHub-only fields.
  repoFull?: string;
  gitRef?: string;
  path?: string;
  downloadUrl?: string;
  htmlUrl?: string;
}

export const FOLDER_MIME = "application/vnd.google-apps.folder";
const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

// Synthetic MIME type from a file name (used for GitHub entries so the existing
// icon/preview logic keeps working).
export function mimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext))
    return `image/${ext === "jpg" ? "jpeg" : ext}`;
  if (ext === "pdf") return "application/pdf";
  if (["md", "markdown"].includes(ext)) return "text/markdown";
  if (["txt", "rst", "csv", "log"].includes(ext)) return "text/plain";
  if (
    [
      "js", "jsx", "ts", "tsx", "py", "java", "c", "h", "cpp", "cc", "cs", "go",
      "rs", "rb", "php", "swift", "kt", "scala", "sh", "bash", "json", "yaml",
      "yml", "toml", "ini", "xml", "html", "css", "scss", "sql", "tex", "m",
      "r", "jl", "lua", "dart", "vue", "svelte",
    ].includes(ext)
  )
    return "text/x-code";
  return "application/octet-stream";
}

// Whether a file's text can be rendered inline in the preview pane.
export function isTextPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith("text/") ||
    mimeType === "application/json" ||
    mimeType === "application/xml"
  );
}

export function isFolder(mimeType: string) {
  return mimeType === FOLDER_MIME;
}

// The MIME type to display for a file, following shortcuts to their target.
export function effectiveMime(file: DriveFile): string {
  if (file.mimeType === SHORTCUT_MIME && file.shortcutDetails?.targetMimeType) {
    return file.shortcutDetails.targetMimeType;
  }
  return file.mimeType;
}

// If a file is a folder (directly, or a shortcut pointing at one), returns the
// id + resource key to list its children. Otherwise null.
export function folderTarget(
  file: DriveFile,
): { id: string; resourceKey?: string } | null {
  if (isFolder(file.mimeType)) {
    return { id: file.id, resourceKey: file.resourceKey };
  }
  if (
    file.mimeType === SHORTCUT_MIME &&
    file.shortcutDetails?.targetMimeType === FOLDER_MIME &&
    file.shortcutDetails.targetId
  ) {
    return {
      id: file.shortcutDetails.targetId,
      resourceKey: file.shortcutDetails.targetResourceKey,
    };
  }
  return null;
}

export function fileIcon(mimeType: string): string {
  if (!mimeType) return "📄";
  if (mimeType.includes("folder")) return "📁";
  if (mimeType.includes("shortcut")) return "🔗";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("image")) return "🖼️";
  if (mimeType.includes("presentation")) return "📊";
  if (mimeType.includes("spreadsheet")) return "📗";
  if (mimeType.includes("document")) return "📝";
  if (mimeType.includes("video")) return "🎥";
  if (mimeType.includes("audio")) return "🎵";
  return "📄";
}

// Embeddable preview URL for a public file (PDF, Docs, Slides, Sheets, images).
export function previewUrl(file: DriveFile): string | null {
  if (folderTarget(file)) return null;
  const id =
    file.mimeType === SHORTCUT_MIME && file.shortcutDetails?.targetId
      ? file.shortcutDetails.targetId
      : file.id;
  const key =
    file.mimeType === SHORTCUT_MIME
      ? file.shortcutDetails?.targetResourceKey
      : file.resourceKey;
  const suffix = key ? `?resourcekey=${encodeURIComponent(key)}` : "";
  return `https://drive.google.com/file/d/${id}/preview${suffix}`;
}

export function openInDriveUrl(file: DriveFile): string {
  if (file.webViewLink) return file.webViewLink;
  const tgt = folderTarget(file);
  if (tgt) {
    const suffix = tgt.resourceKey
      ? `?resourcekey=${encodeURIComponent(tgt.resourceKey)}`
      : "";
    return `https://drive.google.com/drive/folders/${tgt.id}${suffix}`;
  }
  const suffix = file.resourceKey
    ? `?resourcekey=${encodeURIComponent(file.resourceKey)}`
    : "";
  return `https://drive.google.com/file/d/${file.id}/view${suffix}`;
}

// Extracts the folder id (and optional resource key) from a Drive share link.
// Accepts /drive/folders/<id>?resourcekey=<key>, /open?id=<id>, or a bare id.
export function parseDriveFolderLink(
  input: string,
): { folderId: string; resourceKey?: string } | null {
  const raw = input.trim();
  if (!raw) return null;

  let folderId: string | null = null;
  const folders = raw.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folders) folderId = folders[1];
  if (!folderId) {
    const openId = raw.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (openId) folderId = openId[1];
  }
  if (!folderId && /^[a-zA-Z0-9_-]{10,}$/.test(raw)) {
    folderId = raw;
  }
  if (!folderId) return null;

  let resourceKey: string | undefined;
  const rk = raw.match(/[?&]resourcekey=([^&\s]+)/i);
  if (rk) resourceKey = decodeURIComponent(rk[1]);

  return { folderId, resourceKey };
}
