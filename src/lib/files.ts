// Client-safe helpers for Drive file display (no server imports).

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
}

export function isFolder(mimeType: string) {
  return mimeType === "application/vnd.google-apps.folder";
}

export function fileIcon(mimeType: string): string {
  if (!mimeType) return "📄";
  if (mimeType.includes("folder")) return "📁";
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
  if (isFolder(file.mimeType)) return null;
  return `https://drive.google.com/file/d/${file.id}/preview`;
}

export function openInDriveUrl(file: DriveFile): string {
  return file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
}
