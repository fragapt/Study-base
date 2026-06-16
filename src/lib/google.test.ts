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
  it("treats any dated event as an exam, regardless of title", () => {
    expect(isExam({ id: "1", summary: "Teste de Eletricidade", start: { date: "2026-06-20" } })).toBe(true);
    expect(isExam({ id: "2", summary: "Qualquer evento", start: { dateTime: "2026-06-20T10:00:00Z" } })).toBe(true);
    expect(isExam({ id: "3", summary: "", start: { date: "2026-06-20" } })).toBe(true);
  });
  it("skips malformed events with no start date", () => {
    expect(isExam({ id: "4", summary: "Sem data", start: {} } as CalendarEvent)).toBe(false);
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

  it("sends the resource-key header for legacy folders", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ files: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    await listDriveFolder("LEGACY", "rk123");
    const opts = fetchMock.mock.calls[0][1] as {
      headers?: Record<string, string>;
    };
    expect(opts.headers?.["X-Goog-Drive-Resource-Keys"]).toBe("LEGACY/rk123");
  });

  it("omits the resource-key header when none is given", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ files: [] }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    await listDriveFolder("NEW");
    const opts = fetchMock.mock.calls[0][1] as {
      headers?: Record<string, string>;
    };
    expect(opts.headers?.["X-Goog-Drive-Resource-Keys"]).toBeUndefined();
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
