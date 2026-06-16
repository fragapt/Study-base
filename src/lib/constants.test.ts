import { describe, it, expect } from "vitest";
import { DEFAULT_TEMPLATE, normalize, examMatches } from "./constants";

describe("normalize", () => {
  it("lowercases and strips accents", () => {
    expect(normalize("Mecânica dos Sólidos")).toBe("mecanica dos solidos");
    expect(normalize("Conceção")).toBe("concecao");
  });
});

describe("examMatches", () => {
  it("matches when a keyword is present (accent/case-insensitive)", () => {
    expect(examMatches("Eletricidade - testes", ["eletric"])).toBe(true);
    expect(examMatches("MECANICA testes", ["mecanica"])).toBe(true);
    expect(examMatches("Materiais Não-Metálicos", ["metalic"])).toBe(true);
  });

  it("does not match unrelated titles", () => {
    expect(examMatches("Mecânica dos Sólidos", ["eletric"])).toBe(false);
    expect(examMatches("Eletricidade", ["cfac"])).toBe(false);
  });

  it("ignores empty keywords", () => {
    expect(examMatches("qualquer coisa", [""])).toBe(false);
  });
});

describe("DEFAULT_TEMPLATE integrity", () => {
  it("has unique drive keys", () => {
    const keys = DEFAULT_TEMPLATE.drives.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("every subject folder references a known drive key", () => {
    const driveKeys = new Set(DEFAULT_TEMPLATE.drives.map((d) => d.key));
    DEFAULT_TEMPLATE.subjects.forEach((s) => {
      s.folders.forEach((f) => {
        expect(driveKeys.has(f.driveKey)).toBe(true);
      });
    });
  });

  it("subjects have unique slugs and at least one topic", () => {
    const slugs = DEFAULT_TEMPLATE.subjects.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    DEFAULT_TEMPLATE.subjects.forEach((s) => {
      expect(s.topics.length).toBeGreaterThan(0);
    });
  });

  it("legacy NEEM folders carry a resource key", () => {
    const legacy = DEFAULT_TEMPLATE.subjects
      .flatMap((s) => s.folders)
      .filter((f) => f.folderId.startsWith("0B7x"));
    expect(legacy.length).toBeGreaterThan(0);
    legacy.forEach((f) => expect(f.resourceKey).toBeTruthy());
  });
});
