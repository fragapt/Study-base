import { describe, it, expect } from "vitest";
import { parseGithubRepoLink, looksLikeGithub } from "./githubLink";

describe("parseGithubRepoLink", () => {
  it("parses a plain repo url", () => {
    expect(parseGithubRepoLink("https://github.com/torvalds/linux")).toEqual({
      repoFull: "torvalds/linux",
      ref: undefined,
      path: undefined,
    });
  });
  it("strips a trailing .git", () => {
    expect(parseGithubRepoLink("https://github.com/a/b.git")).toEqual({
      repoFull: "a/b",
      ref: undefined,
      path: undefined,
    });
  });
  it("parses a /tree/<ref>/<path> url", () => {
    expect(
      parseGithubRepoLink("https://github.com/owner/repo/tree/main/src/lib"),
    ).toEqual({ repoFull: "owner/repo", ref: "main", path: "src/lib" });
  });
  it("parses a /blob/<ref>/<path> url", () => {
    expect(
      parseGithubRepoLink("https://github.com/owner/repo/blob/dev/README.md"),
    ).toEqual({ repoFull: "owner/repo", ref: "dev", path: "README.md" });
  });
  it("accepts bare owner/repo", () => {
    expect(parseGithubRepoLink("owner/repo")).toEqual({ repoFull: "owner/repo" });
  });
  it("returns null for non-github input", () => {
    expect(parseGithubRepoLink("https://drive.google.com/drive/folders/abc")).toBeNull();
    expect(parseGithubRepoLink("")).toBeNull();
  });
});

describe("looksLikeGithub", () => {
  it("detects github links and bare slugs", () => {
    expect(looksLikeGithub("https://github.com/a/b")).toBe(true);
    expect(looksLikeGithub("owner/repo")).toBe(true);
    expect(looksLikeGithub("https://drive.google.com/drive/folders/x")).toBe(false);
  });
});
