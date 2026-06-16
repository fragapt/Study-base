// Client-safe helpers for Drive file display (no server imports).

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
}

const FOLDER_MIME = "application/vnd.google-apps.folder";
const SHORTCUT_MIME = "application/vnd.google-apps.shortcut";

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
