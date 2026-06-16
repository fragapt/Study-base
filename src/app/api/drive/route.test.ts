// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/google", () => ({ listDriveFolder: vi.fn() }));
import { listDriveFolder } from "@/lib/google";
import { GET } from "./route";

const mocked = vi.mocked(listDriveFolder);

function req(url: string) {
  return new NextRequest(url);
}

describe("GET /api/drive", () => {
  beforeEach(() => mocked.mockReset());

  it("400s when folderId is missing", async () => {
    const res = await GET(req("http://localhost/api/drive"));
    expect(res.status).toBe(400);
  });

  it("returns the listed files on success", async () => {
    mocked.mockResolvedValue([
      { id: "f1", name: "Aula", mimeType: "application/pdf" },
    ]);
    const res = await GET(req("http://localhost/api/drive?folderId=ABC"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.files).toHaveLength(1);
    expect(mocked).toHaveBeenCalledWith("ABC");
  });

  it("502s when the Drive helper throws", async () => {
    mocked.mockImplementation(async () => {
      throw new Error("Drive API 403");
    });
    const res = await GET(req("http://localhost/api/drive?folderId=ABC"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/403/);
  });
});
