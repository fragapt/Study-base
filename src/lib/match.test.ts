import { describe, it, expect } from "vitest";
import {
  subjectKeywords,
  folderMatchesSubject,
  suggestFolders,
  type ScannedFolder,
} from "./match";
import type { SubjectRow } from "@/lib/supabase/types";

function subject(partial: Partial<SubjectRow>): SubjectRow {
  return {
    id: "s1",
    user_id: "u1",
    slug: "eletricidade",
    name: "Eletricidade",
    color: "#000",
    icon: "⚡",
    exam_match: [],
    position: 0,
    created_at: "",
    ...partial,
  };
}

describe("subjectKeywords", () => {
  it("combines exam keywords with name words (≥4 chars)", () => {
    const kws = subjectKeywords(
      subject({ name: "Mecânica dos Sólidos", exam_match: ["mec"] }),
    );
    expect(kws).toContain("mec");
    expect(kws).toContain("mecanica");
    expect(kws).toContain("solidos");
    // short words like "dos" are dropped
    expect(kws).not.toContain("dos");
  });
});

describe("folderMatchesSubject", () => {
  it("matches a folder named after the subject", () => {
    expect(folderMatchesSubject("Eletricidade", subject({}))).toBe(true);
    expect(folderMatchesSubject("ELETRICIDADE 2024", subject({}))).toBe(true);
  });
  it("matches via an exam keyword", () => {
    expect(
      folderMatchesSubject("CFAC", subject({ name: "Conceção", exam_match: ["cfac"] })),
    ).toBe(true);
  });
  it("does not match unrelated folders", () => {
    expect(folderMatchesSubject("Cálculo", subject({}))).toBe(false);
  });
});

describe("suggestFolders", () => {
  it("emits a suggestion per matching (folder, subject)", () => {
    const folders: ScannedFolder[] = [
      { driveId: "d1", folderId: "f1", name: "Eletricidade" },
      { driveId: "d1", folderId: "f2", name: "Cálculo" },
    ];
    const subjects = [
      subject({ id: "s1", name: "Eletricidade" }),
      subject({ id: "s2", name: "Mecânica dos Sólidos" }),
    ];
    const out = suggestFolders(folders, subjects);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ folderId: "f1", subjectId: "s1" });
  });
});
