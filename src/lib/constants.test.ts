import { describe, it, expect } from "vitest";
import {
  DRIVES,
  DRIVE_BY_KEY,
  SUBJECTS,
  SUBJECT_BY_SLUG,
  FALLBACK_TOPICS,
  normalize,
  examMatchesSubject,
  DriveKey,
} from "./constants";

describe("normalize", () => {
  it("lowercases and strips accents", () => {
    expect(normalize("Mecânica dos Sólidos")).toBe("mecanica dos solidos");
    expect(normalize("Conceção")).toBe("concecao");
  });
});

describe("examMatchesSubject", () => {
  const bySlug = (s: string) => SUBJECT_BY_SLUG[s];

  it("matches each subject's typical exam title", () => {
    expect(examMatchesSubject("Eletricidade - testes", bySlug("eletricidade"))).toBe(true);
    expect(examMatchesSubject("CFAC testes", bySlug("cfac"))).toBe(true);
    expect(
      examMatchesSubject("Materiais Não-Metálicos testes", bySlug("materiais-nao-metalicos")),
    ).toBe(true);
    expect(
      examMatchesSubject("Mecânica dos Sólidos testes", bySlug("mecanica-dos-solidos")),
    ).toBe(true);
  });

  it("does not match unrelated titles", () => {
    expect(examMatchesSubject("Mecânica dos Sólidos", bySlug("eletricidade"))).toBe(false);
    expect(examMatchesSubject("Eletricidade", bySlug("cfac"))).toBe(false);
  });

  it("is accent and case insensitive", () => {
    expect(examMatchesSubject("MECANICA testes", bySlug("mecanica-dos-solidos"))).toBe(true);
  });
});

describe("data integrity", () => {
  it("indexes are consistent", () => {
    expect(Object.keys(DRIVE_BY_KEY).sort()).toEqual(DRIVES.map((d) => d.key).sort());
    SUBJECTS.forEach((s) => {
      expect(SUBJECT_BY_SLUG[s.slug]).toBe(s);
    });
  });

  it("every subject folder maps to a known drive key", () => {
    const driveKeys = new Set(DRIVES.map((d) => d.key));
    SUBJECTS.forEach((s) => {
      (Object.keys(s.folders) as DriveKey[]).forEach((k) => {
        expect(driveKeys.has(k)).toBe(true);
      });
    });
  });

  it("every subject has fallback topics keyed by its name", () => {
    SUBJECTS.forEach((s) => {
      expect(Array.isArray(FALLBACK_TOPICS[s.name])).toBe(true);
      expect(FALLBACK_TOPICS[s.name].length).toBeGreaterThan(0);
    });
  });

  it("subjects have unique slugs", () => {
    const slugs = SUBJECTS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
