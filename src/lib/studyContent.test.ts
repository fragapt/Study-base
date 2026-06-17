import { describe, it, expect } from "vitest";
import {
  parseFlashcards,
  parseQuiz,
  parseMindmap,
  parseResumo,
  parseRetrieval,
  parseStudyContent,
} from "./studyContent";

describe("parseFlashcards", () => {
  it("parses a clean array", () => {
    const cards = parseFlashcards('[{"front":"Q1","back":"A1"},{"front":"Q2","back":"A2"}]');
    expect(cards).toEqual([
      { front: "Q1", back: "A1" },
      { front: "Q2", back: "A2" },
    ]);
  });

  it("tolerates fences and question/answer keys", () => {
    const cards = parseFlashcards('```json\n[{"question":"Q","answer":"A"}]\n```');
    expect(cards).toEqual([{ front: "Q", back: "A" }]);
  });

  it("drops incomplete cards and returns [] on garbage", () => {
    expect(parseFlashcards('[{"front":"only front"}]')).toEqual([]);
    expect(parseFlashcards("not json at all")).toEqual([]);
  });
});

describe("parseQuiz", () => {
  it("parses questions with answerIndex", () => {
    const q = parseQuiz(
      '[{"question":"2+2?","options":["3","4","5"],"answerIndex":1,"explanation":"soma"}]',
    );
    expect(q).toHaveLength(1);
    expect(q[0].answerIndex).toBe(1);
    expect(q[0].explanation).toBe("soma");
  });

  it("resolves an `answer` given as option text", () => {
    const q = parseQuiz('[{"question":"x","options":["a","b"],"answer":"b"}]');
    expect(q[0].answerIndex).toBe(1);
  });

  it("rejects questions with too few options or a bad index", () => {
    expect(parseQuiz('[{"question":"x","options":["a"],"answerIndex":0}]')).toEqual([]);
    expect(
      parseQuiz('[{"question":"x","options":["a","b"],"answerIndex":9}]'),
    ).toEqual([]);
  });
});

describe("parseMindmap", () => {
  it("parses a nested object", () => {
    const root = parseMindmap(
      '{"title":"Root","children":[{"title":"A"},{"title":"B","children":[{"title":"B1"}]}]}',
    );
    expect(root?.title).toBe("Root");
    expect(root?.children).toHaveLength(2);
    expect(root?.children?.[1].children?.[0].title).toBe("B1");
  });

  it("wraps a bare array of nodes", () => {
    const root = parseMindmap('[{"title":"A"},{"title":"B"}]');
    expect(root?.children).toHaveLength(2);
  });

  it("returns null on garbage", () => {
    expect(parseMindmap("nope")).toBeNull();
  });
});

describe("parseResumo", () => {
  it("strips a markdown code fence", () => {
    expect(parseResumo("```markdown\n# Título\nTexto\n```")).toBe("# Título\nTexto");
  });
  it("returns plain text unchanged", () => {
    expect(parseResumo("# Título")).toBe("# Título");
  });
});

describe("parseRetrieval", () => {
  it("parses name/reason pairs and tolerates aliases", () => {
    const hits = parseRetrieval(
      '[{"name":"aula1.pdf","reason":"cobre o tópico"},{"file":"aula2.pdf","why":"intro"}]',
    );
    expect(hits).toEqual([
      { name: "aula1.pdf", reason: "cobre o tópico" },
      { name: "aula2.pdf", reason: "intro" },
    ]);
  });
});

describe("parseStudyContent", () => {
  it("dispatches by kind", () => {
    expect(parseStudyContent("resumo", "# Olá")).toEqual({
      kind: "resumo",
      markdown: "# Olá",
    });
    expect(parseStudyContent("flashcards", '[{"front":"a","back":"b"}]')).toEqual({
      kind: "flashcards",
      cards: [{ front: "a", back: "b" }],
    });
    expect(parseStudyContent("quiz", "garbage")).toBeNull();
  });
});
