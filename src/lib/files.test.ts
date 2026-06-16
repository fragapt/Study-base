import { describe, it, expect } from "vitest";
import {
  isFolder,
  fileIcon,
  previewUrl,
  openInDriveUrl,
  parseDriveFolderLink,
  folderTarget,
  effectiveMime,
  DriveFile,
} from "./files";

const FOLDER = "application/vnd.google-apps.folder";
const SHORTCUT = "application/vnd.google-apps.shortcut";

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
  it("appends the resource key for legacy files", () => {
    expect(
      openInDriveUrl(file({ id: "ID1", webViewLink: undefined, resourceKey: "rk1" })),
    ).toBe("https://drive.google.com/file/d/ID1/view?resourcekey=rk1");
  });
});

describe("folderTarget", () => {
  it("returns id + resourceKey for a real folder", () => {
    expect(folderTarget(file({ id: "F1", mimeType: FOLDER, resourceKey: "rk" }))).toEqual({
      id: "F1",
      resourceKey: "rk",
    });
  });
  it("follows a shortcut that points at a folder", () => {
    const f = file({
      id: "SC",
      mimeType: SHORTCUT,
      shortcutDetails: {
        targetId: "TARGET",
        targetMimeType: FOLDER,
        targetResourceKey: "trk",
      },
    });
    expect(folderTarget(f)).toEqual({ id: "TARGET", resourceKey: "trk" });
  });
  it("is null for plain files", () => {
    expect(folderTarget(file({ mimeType: "application/pdf" }))).toBeNull();
  });
});

describe("effectiveMime", () => {
  it("resolves a shortcut to its target mime", () => {
    expect(
      effectiveMime(
        file({ mimeType: SHORTCUT, shortcutDetails: { targetMimeType: FOLDER } }),
      ),
    ).toBe(FOLDER);
  });
});

describe("parseDriveFolderLink", () => {
  it("parses a /folders/ link with a resource key", () => {
    expect(
      parseDriveFolderLink(
        "https://drive.google.com/drive/folders/0B7xIfG8giVLkZUhh?resourcekey=0-IAxazq",
      ),
    ).toEqual({ folderId: "0B7xIfG8giVLkZUhh", resourceKey: "0-IAxazq" });
  });
  it("parses a /folders/ link without a key", () => {
    expect(
      parseDriveFolderLink("https://drive.google.com/drive/folders/1QNE0knQxCFR"),
    ).toEqual({ folderId: "1QNE0knQxCFR", resourceKey: undefined });
  });
  it("parses an open?id= link", () => {
    expect(parseDriveFolderLink("https://drive.google.com/open?id=1ABCdefGHIjk")).toEqual({
      folderId: "1ABCdefGHIjk",
      resourceKey: undefined,
    });
  });
  it("accepts a bare id", () => {
    expect(parseDriveFolderLink("1QNE0knQxCFRlomaKCKq0")).toEqual({
      folderId: "1QNE0knQxCFRlomaKCKq0",
      resourceKey: undefined,
    });
  });
  it("returns null for empty input", () => {
    expect(parseDriveFolderLink("   ")).toBeNull();
  });
});
