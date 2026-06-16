// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

// Integration: exercises the route + the real listDriveFolder against a stubbed fetch.
function req(url: string) {
  return new NextRequest(url);
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_API_KEY", "testkey");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/drive", () => {
  it("400s when folderId is missing", async () => {
    const res = await GET(req("http://localhost/api/drive"));
    expect(res.status).toBe(400);
  });

  it("returns the listed files on success", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        files: [{ id: "f1", name: "Aula", mimeType: "application/pdf" }],
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await GET(req("http://localhost/api/drive?folderId=ABC"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.files).toHaveLength(1);
    expect(body.files[0].name).toBe("Aula");
    expect(fetchMock.mock.calls[0][0]).toContain("ABC");
  });

  it("502s when the Drive API returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, text: async () => "forbidden" })),
    );
    const res = await GET(req("http://localhost/api/drive?folderId=ABC"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/403/);
  });
});
