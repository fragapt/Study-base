// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/google", () => ({
  listCalendarEvents: vi.fn(),
  isExam: (ev: { summary?: string }) =>
    (ev.summary ?? "").toLowerCase().includes("testes"),
}));
import { listCalendarEvents } from "@/lib/google";
import { GET } from "./route";

const mocked = vi.mocked(listCalendarEvents);

describe("GET /api/calendar", () => {
  beforeEach(() => mocked.mockReset());

  it("filters to exam events and maps fields", async () => {
    mocked.mockResolvedValue([
      { id: "a", summary: "Eletricidade testes", start: { date: "2026-06-20" } },
      { id: "b", summary: "Aula normal", start: { dateTime: "2026-06-21T10:00:00Z" } },
      {
        id: "c",
        summary: "CFAC testes",
        start: { dateTime: "2026-06-22T09:00:00Z" },
        location: "Sala 1",
      },
    ]);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.exams).toHaveLength(2);
    expect(body.exams.map((e: { id: string }) => e.id)).toEqual(["a", "c"]);
    const allDay = body.exams.find((e: { id: string }) => e.id === "a");
    expect(allDay.allDay).toBe(true);
    const timed = body.exams.find((e: { id: string }) => e.id === "c");
    expect(timed.allDay).toBe(false);
    expect(timed.location).toBe("Sala 1");
  });

  it("502s when the calendar helper throws", async () => {
    mocked.mockImplementation(() => {
      throw new Error("Calendar API 404");
    });
    const res = await GET();
    expect(res.status).toBe(502);
  });
});
