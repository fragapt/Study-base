// Server-side GitHub REST helpers for browsing PUBLIC repositories. An optional
// GITHUB_TOKEN raises the rate limit (60/h anonymous → 5000/h). Never import
// from client code.

import "server-only";

const API = "https://api.github.com";

export interface GithubEntry {
  name: string;
  path: string;
  type: "dir" | "file" | "symlink" | "submodule";
  size: number;
  downloadUrl: string | null;
  htmlUrl: string | null;
  sha: string;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "base-de-estudo",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

interface RawEntry {
  name: string;
  path: string;
  type: GithubEntry["type"];
  size: number;
  download_url: string | null;
  html_url: string | null;
  sha: string;
}

// Lists the contents of a repo path. `repoFull` is "owner/repo".
export async function listRepoContents(
  repoFull: string,
  path = "",
  ref?: string,
): Promise<GithubEntry[]> {
  const url = new URL(
    `${API}/repos/${repoFull}/contents/${path.replace(/^\/+/, "")}`,
  );
  if (ref) url.searchParams.set("ref", ref);

  const res = await fetch(url, { headers: headers(), next: { revalidate: 300 } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  // A file path returns a single object; a directory returns an array.
  const arr = (Array.isArray(data) ? data : [data]) as RawEntry[];
  return arr.map((e) => ({
    name: e.name,
    path: e.path,
    type: e.type,
    size: e.size,
    downloadUrl: e.download_url,
    htmlUrl: e.html_url,
    sha: e.sha,
  }));
}

// Fetches a raw file's text, capped at `maxBytes`. Returns null for binary or
// over-size files.
export async function getRawFile(
  downloadUrl: string,
  maxBytes = 200_000,
): Promise<string | null> {
  const res = await fetch(downloadUrl, {
    headers: { "User-Agent": "base-de-estudo" },
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const len = Number(res.headers.get("content-length") ?? "0");
  if (len && len > maxBytes) return null;
  const text = await res.text();
  if (text.length > maxBytes) return text.slice(0, maxBytes);
  return text;
}
