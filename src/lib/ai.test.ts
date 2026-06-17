// @vitest-environment node
import { describe, it, expect } from "vitest";
import { parseMilestones, extractAssistantText } from "./ai";

describe("extractAssistantText (IAedu stream)", () => {
  const stream = [
    '{"type": "start", "content": "Processing"}',
    '',
    '{"type": "token", "content": "["}',
    '',
    '{"type": "token", "content": "{\\"title\\":\\"A\\"}]"}',
    '',
    '{"type": "message", "content": {"type": "ai", "content": "[{\\"title\\":\\"A\\",\\"description\\":\\"\\"}]"}}',
    '',
    '{"type": "done", "content": "x"}',
  ].join("\n");

  it("prefers the final message event", () => {
    expect(extractAssistantText(stream)).toBe('[{"title":"A","description":""}]');
  });

  it("falls back to concatenated tokens when no message event", () => {
    const onlyTokens = [
      '{"type": "token", "content": "Hello "}',
      '{"type": "token", "content": "world"}',
    ].join("\n");
    expect(extractAssistantText(onlyTokens)).toBe("Hello world");
  });

  it("ignores malformed lines", () => {
    expect(extractAssistantText("not json\n{bad}\n")).toBe("");
  });
});

describe("parseMilestones", () => {
  it("parses a clean JSON array", () => {
    const out = parseMilestones(
      '[{"title":"A","description":"da"},{"title":"B","description":""}]',
    );
    expect(out).toEqual([
      { title: "A", description: "da" },
      { title: "B", description: "" },
    ]);
  });

  it("tolerates surrounding prose / code fences", () => {
    const text =
      "Aqui está:\n```json\n[{\"title\":\"X\",\"description\":\"y\"}]\n```\nFim.";
    expect(parseMilestones(text)).toEqual([{ title: "X", description: "y" }]);
  });

  it("drops entries without a title and caps at 25", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      title: i % 2 === 0 ? `T${i}` : "",
      description: "",
    }));
    const out = parseMilestones(JSON.stringify(many));
    expect(out.length).toBeLessThanOrEqual(25);
    expect(out.every((m) => m.title.length > 0)).toBe(true);
  });

  it("returns [] for non-JSON", () => {
    expect(parseMilestones("não há nada aqui")).toEqual([]);
  });
});
