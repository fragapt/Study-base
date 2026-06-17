import { describe, it, expect } from "vitest";
import { buildStudyPrompt, buildRetrievalPrompt } from "./studyPrompts";
import type { MaterialEntry } from "./milestones";

const entries: MaterialEntry[] = [
  { name: "aula1.pdf", isFolder: false },
  { name: "exercicios", isFolder: true },
];
const snippets = [{ name: "aula1.pdf", text: "conteúdo da aula" }];

describe("buildStudyPrompt", () => {
  it("includes the subject, objective, focus and the kind's JSON instruction", () => {
    const p = buildStudyPrompt(
      "flashcards",
      "Álgebra",
      { topics: ["Matrizes"], documents: [] },
      "preparar teste em 5 dias",
      entries,
      snippets,
    );
    expect(p).toContain("Álgebra");
    expect(p).toContain("preparar teste em 5 dias");
    expect(p).toContain("Matrizes");
    expect(p).toContain("aula1.pdf");
    expect(p).toContain('"front"');
  });

  it("uses Markdown (not JSON) instruction for resumo", () => {
    const p = buildStudyPrompt(
      "resumo",
      "Álgebra",
      { topics: [], documents: ["aula1.pdf"] },
      "",
      entries,
      snippets,
    );
    expect(p).toContain("Markdown");
    expect(p).toContain("aula1.pdf");
  });

  it("emits the quiz and mindmap shapes for their kinds", () => {
    expect(
      buildStudyPrompt("quiz", "X", { topics: [], documents: [] }, "", entries, snippets),
    ).toContain('"answerIndex"');
    expect(
      buildStudyPrompt("mindmap", "X", { topics: [], documents: [] }, "", entries, snippets),
    ).toContain('"children"');
  });
});

describe("buildRetrievalPrompt", () => {
  it("includes the query, materials and a JSON instruction", () => {
    const p = buildRetrievalPrompt("Álgebra", "matrizes", entries, snippets);
    expect(p).toContain("matrizes");
    expect(p).toContain("aula1.pdf");
    expect(p).toContain('"reason"');
  });
});
