import { describe, it, expect } from "vitest";
import {
  looksInformative,
  buildTasksPrompt,
  buildMilestonesPrompt,
  type MaterialEntry,
} from "./milestones";

describe("looksInformative", () => {
  it("flags syllabus/index-like names (accent-insensitive)", () => {
    expect(looksInformative("Programa.pdf")).toBe(true);
    expect(looksInformative("indice-geral.txt")).toBe(true);
    expect(looksInformative("README.md")).toBe(true);
    expect(looksInformative("Ementa da Cadeira")).toBe(true);
  });
  it("does not flag ordinary material names", () => {
    expect(looksInformative("aula3.pdf")).toBe(false);
  });
});

const entries: MaterialEntry[] = [
  { name: "Leis de Kirchhoff", isFolder: true },
  { name: "Teoremas de Thevenin.pdf", isFolder: false },
];
const snippets = [{ name: "programa.txt", text: "Conteúdos: circuitos DC" }];

describe("buildTasksPrompt", () => {
  it("includes the subject, materials and JSON instruction; frames as tasks", () => {
    const p = buildTasksPrompt("Eletricidade", entries, snippets);
    expect(p).toContain("Eletricidade");
    expect(p).toContain("Leis de Kirchhoff");
    expect(p).toContain("Teoremas de Thevenin.pdf");
    expect(p).toContain("programa.txt");
    expect(p).toMatch(/TAREFAS/);
    expect(p).toContain('{"title": string, "description": string}');
  });
});

describe("buildMilestonesPrompt", () => {
  it("frames the request as an ordered learning path", () => {
    const p = buildMilestonesPrompt("Eletricidade", entries, snippets);
    expect(p).toContain("Eletricidade");
    expect(p).toContain("Leis de Kirchhoff");
    expect(p).toMatch(/PERCURSO DE APRENDIZAGEM/);
    expect(p).toMatch(/ORDENADAS/);
    expect(p).toContain('{"title": string, "description": string}');
  });
});
