import { describe, it, expect } from "vitest";
import { isFolder, fileIcon, previewUrl, openInDriveUrl, DriveFile } from "./files";

const FOLDER = "application/vnd.google-apps.folder";

function file(partial: Partial<DriveFile>): DriveFile {
  return { id: "abc", name: "x", mimeType: "application/pdf", ...partial };
}

describe("isFolder", () => {
  it("detects folders", () => {
    expect(isFolder(FOLDER)).toBe(true);
    expect(isFolder("application/pdf")).toBe(false);
  });
});

describe("fileIcon", () => {
  it("maps mime types to icons", () => {
    expect(fileIcon(FOLDER)).toBe("📁");
    expect(fileIcon("application/pdf")).toBe("📄");
    expect(fileIcon("image/png")).toBe("🖼️");
    expect(fileIcon("application/vnd.google-apps.presentation")).toBe("📊");
    expect(fileIcon("application/vnd.google-apps.spreadsheet")).toBe("📗");
    expect(fileIcon("application/vnd.google-apps.document")).toBe("📝");
    expect(fileIcon("video/mp4")).toBe("🎥");
    expect(fileIcon("audio/mpeg")).toBe("🎵");
    expect(fileIcon("application/zip")).toBe("📄");
    expect(fileIcon("")).toBe("📄");
  });
});

describe("previewUrl", () => {
  it("is null for folders", () => {
    expect(previewUrl(file({ mimeType: FOLDER }))).toBeNull();
  });
  it("builds an embeddable preview url for files", () => {
    expect(previewUrl(file({ id: "XYZ" }))).toBe(
      "https://drive.google.com/file/d/XYZ/preview",
    );
  });
});

describe("openInDriveUrl", () => {
  it("prefers webViewLink when present", () => {
    expect(openInDriveUrl(file({ webViewLink: "https://drive.google.com/open?id=1" }))).toBe(
      "https://drive.google.com/open?id=1",
    );
  });
  it("falls back to a view url from the id", () => {
    expect(openInDriveUrl(file({ id: "ID1", webViewLink: undefined }))).toBe(
      "https://drive.google.com/file/d/ID1/view",
    );
  });
});
