// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isFolder,
  isExam,
  listDriveFolder,
  listCalendarEvents,
  type CalendarEvent,
} from "./google";

describe("isFolder", () => {
  it("detects the Drive folder mime type", () => {
    expect(isFolder("application/vnd.google-apps.folder")).toBe(true);
    expect(isFolder("application/pdf")).toBe(false);
  });
});

describe("isExam", () => {
  const ev = (summary: string): CalendarEvent => ({
    id: "1",
    summary,
    start: { date: "2026-06-20" },
  });
  it("matches titles containing 'testes' (case-insensitive)", () => {
    expect(isExam(ev("Aula de testes"))).toBe(true);
    expect(isExam(ev("TESTES de Eletricidade"))).toBe(true);
  });
  it("rejects titles without the keyword", () => {
    expect(isExam(ev("Exame normal"))).toBe(false);
    expect(isExam(ev(""))).toBe(false);
  });
});

describe("listDriveFolder", () => {
  beforeEach(() => {
    vi.stubEnv("GOOGLE_API_KEY", "testkey");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("calls the Drive API with the folder id + key and returns files", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ files: [{ id: "f1", name: "Aula", mimeType: "application/pdf" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const files = await listDriveFolder("FOLDER123");
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe("Aula");

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("FOLDER123");
    expect(calledUrl).toContain("key=testkey");
  });

  it("throws a descriptive error on non-OK responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, text: async () => "forbidden" })),
    );
    await expect(listDriveFolder("X")).rejects.toThrow(/403/);
  });
});

describe("listCalendarEvents", () => {
  beforeEach(() => vi.stubEnv("GOOGLE_API_KEY", "testkey"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns the calendar items array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ items: [{ id: "e1", summary: "X testes", start: {} }] }),
      })),
    );
    const events = await listCalendarEvents("cal@group.calendar.google.com");
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("e1");
  });

  it("throws when GOOGLE_API_KEY is missing", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("GOOGLE_API_KEY", "");
    await expect(listCalendarEvents("cal")).rejects.toThrow(/GOOGLE_API_KEY/);
  });
});
