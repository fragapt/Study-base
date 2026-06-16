// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Force the no-Supabase path so the route falls back to EXAM_CALENDAR_ID and
// never touches the request-scoped Supabase client.
vi.mock("@/lib/env", () => ({
  HAS_SUPABASE: false,
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
}));

import { GET } from "./route";

// Integration: route + the real listCalendarEvents/isExam against a stubbed fetch.
beforeEach(() => {
  vi.stubEnv("GOOGLE_API_KEY", "testkey");
  vi.stubEnv("EXAM_CALENDAR_ID", "cal@group.calendar.google.com");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/calendar", () => {
  it("returns every dated event and maps fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          items: [
            { id: "a", summary: "Eletricidade", start: { date: "2026-06-20" } },
            { id: "b", summary: "Aula normal", start: { dateTime: "2026-06-21T10:00:00Z" } },
            {
              id: "c",
              summary: "CFAC",
              start: { dateTime: "2026-06-22T09:00:00Z" },
              location: "Sala 1",
            },
            { id: "d", summary: "Sem data", start: {} },
          ],
        }),
      })),
    );

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    // a, b, c are returned; d is skipped (no start date).
    expect(body.exams).toHaveLength(3);
    expect(body.exams.map((e: { id: string }) => e.id)).toEqual(["a", "b", "c"]);
    expect(body.exams.find((e: { id: string }) => e.id === "a").allDay).toBe(true);
    const timed = body.exams.find((e: { id: string }) => e.id === "c");
    expect(timed.allDay).toBe(false);
    expect(timed.location).toBe("Sala 1");
  });

  it("returns an empty list when no calendar is configured", async () => {
    vi.stubEnv("EXAM_CALENDAR_ID", "");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exams).toEqual([]);
  });

  it("502s when the Calendar API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, text: async () => "not found" })),
    );
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
