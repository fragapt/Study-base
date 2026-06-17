// Client-safe types + pure parsers for AI-generated study content. No server
// imports here: the API routes parse the agent's reply with these, and the
// client renderers (FlashcardDeck, QuizRunner, MindmapView, ResumoView) consume
// the same types. Keep this dependency-free so it stays unit-testable.

export type StudyKind = "resumo" | "flashcards" | "quiz" | "mindmap";

export const STUDY_KINDS: { kind: StudyKind; label: string; icon: string }[] = [
  { kind: "resumo", label: "Resumo", icon: "📝" },
  { kind: "flashcards", label: "Flashcards", icon: "🃏" },
  { kind: "quiz", label: "Quiz", icon: "❓" },
  { kind: "mindmap", label: "Mapa mental", icon: "🧠" },
];

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

export interface MindmapNode {
  title: string;
  children?: MindmapNode[];
}

// The shape stored in `study_resources.content` (jsonb), discriminated by kind.
export type StudyContent =
  | { kind: "resumo"; markdown: string }
  | { kind: "flashcards"; cards: Flashcard[] }
  | { kind: "quiz"; questions: QuizQuestion[] }
  | { kind: "mindmap"; root: MindmapNode };

// A material the agent judged relevant to a search query.
export interface RetrievalHit {
  name: string;
  reason: string;
}

// ── parsing helpers ──────────────────────────────────────────────────

// Strips Markdown code fences and surrounding prose, returning the inner text.
function stripFences(text: string): string {
  const fence = text.match(/```(?:json|markdown|md)?\s*([\s\S]*?)```/i);
  return (fence ? fence[1] : text).trim();
}

// Extracts the first balanced JSON value (array or object) from a string.
function extractJson(text: string): unknown {
  const t = stripFences(text);
  const firstArr = t.indexOf("[");
  const firstObj = t.indexOf("{");
  const candidates: [number, string][] = [];
  if (firstArr !== -1) candidates.push([firstArr, "]"]);
  if (firstObj !== -1) candidates.push([firstObj, "}"]);
  candidates.sort((a, b) => a[0] - b[0]);
  for (const [start, closer] of candidates) {
    const end = t.lastIndexOf(closer);
    if (end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        // try the next candidate
      }
    }
  }
  return null;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function parseResumo(text: string): string {
  // A resumo is free Markdown; just clean fences/whitespace.
  return stripFences(text).trim();
}

export function parseFlashcards(text: string): Flashcard[] {
  const parsed = extractJson(text);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((c) => {
      const o = c as { front?: unknown; back?: unknown; question?: unknown; answer?: unknown };
      return {
        front: asString(o.front) || asString(o.question),
        back: asString(o.back) || asString(o.answer),
      };
    })
    .filter((c) => c.front && c.back)
    .slice(0, 60);
}

export function parseQuiz(text: string): QuizQuestion[] {
  const parsed = extractJson(text);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((q) => {
      const o = q as {
        question?: unknown;
        options?: unknown;
        answerIndex?: unknown;
        answer?: unknown;
        explanation?: unknown;
      };
      const options = Array.isArray(o.options)
        ? o.options.map(asString).filter(Boolean)
        : [];
      let answerIndex =
        typeof o.answerIndex === "number" ? o.answerIndex : -1;
      // Tolerate an `answer` given as the option text.
      if (answerIndex < 0 && typeof o.answer === "string") {
        answerIndex = options.findIndex(
          (opt) => opt.toLowerCase() === o.answer!.toString().trim().toLowerCase(),
        );
      }
      return {
        question: asString(o.question),
        options,
        answerIndex,
        explanation: asString(o.explanation) || undefined,
      };
    })
    .filter(
      (q) =>
        q.question &&
        q.options.length >= 2 &&
        q.answerIndex >= 0 &&
        q.answerIndex < q.options.length,
    )
    .slice(0, 40);
}

function normalizeNode(v: unknown, depth = 0): MindmapNode | null {
  if (depth > 5 || !v || typeof v !== "object") return null;
  const o = v as { title?: unknown; name?: unknown; children?: unknown };
  const title = asString(o.title) || asString(o.name);
  if (!title) return null;
  const childrenRaw = Array.isArray(o.children) ? o.children : [];
  const children = childrenRaw
    .map((c) => normalizeNode(c, depth + 1))
    .filter((c): c is MindmapNode => c !== null)
    .slice(0, 12);
  return children.length ? { title, children } : { title };
}

export function parseMindmap(text: string): MindmapNode | null {
  const parsed = extractJson(text);
  if (Array.isArray(parsed)) {
    // Tolerate a bare array of nodes by wrapping it.
    const children = parsed
      .map((c) => normalizeNode(c))
      .filter((c): c is MindmapNode => c !== null);
    return children.length ? { title: "Mapa", children } : null;
  }
  return normalizeNode(parsed);
}

export function parseRetrieval(text: string): RetrievalHit[] {
  const parsed = extractJson(text);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((h) => {
      const o = h as { name?: unknown; file?: unknown; reason?: unknown; why?: unknown };
      return {
        name: asString(o.name) || asString(o.file),
        reason: asString(o.reason) || asString(o.why),
      };
    })
    .filter((h) => h.name)
    .slice(0, 30);
}

// Parses the agent reply into the content shape for a given kind. Returns null
// when nothing usable came back.
export function parseStudyContent(
  kind: StudyKind,
  text: string,
): StudyContent | null {
  switch (kind) {
    case "resumo": {
      const markdown = parseResumo(text);
      return markdown ? { kind, markdown } : null;
    }
    case "flashcards": {
      const cards = parseFlashcards(text);
      return cards.length ? { kind, cards } : null;
    }
    case "quiz": {
      const questions = parseQuiz(text);
      return questions.length ? { kind, questions } : null;
    }
    case "mindmap": {
      const root = parseMindmap(text);
      return root ? { kind, root } : null;
    }
  }
}
