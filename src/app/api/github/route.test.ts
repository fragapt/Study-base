// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

afterEach(() => vi.unstubAllGlobals());

function req(qs: string) {
  return new NextRequest(`http://localhost/api/github${qs}`);
}

describe("GET /api/github", () => {
  it("400s without a repo", async () => {
    const res = await GET(req(""));
    expect(res.status).toBe(400);
  });

  it("maps GitHub contents to entries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          {
            name: "README.md",
            path: "README.md",
            type: "file",
            size: 12,
            download_url: "https://raw.githubusercontent.com/o/r/main/README.md",
            html_url: "https://github.com/o/r/blob/main/README.md",
            sha: "abc",
          },
          {
            name: "src",
            path: "src",
            type: "dir",
            size: 0,
            download_url: null,
            html_url: "https://github.com/o/r/tree/main/src",
            sha: "def",
          },
        ],
      })),
    );

    const res = await GET(req("?repo=o/r&ref=main"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entries).toHaveLength(2);
    expect(body.entries[0]).toMatchObject({
      name: "README.md",
      type: "file",
      downloadUrl: "https://raw.githubusercontent.com/o/r/main/README.md",
    });
    expect(body.entries[1]).toMatchObject({ name: "src", type: "dir" });
  });

  it("502s on a GitHub API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, text: async () => "Not Found" })),
    );
    const res = await GET(req("?repo=o/missing"));
    expect(res.status).toBe(502);
  });
});
