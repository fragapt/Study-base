// Client-safe parsing of GitHub repository links.

export interface GithubRef {
  repoFull: string; // "owner/repo"
  ref?: string; // branch / tag / sha
  path?: string; // path within the repo
}

// Accepts:
//   https://github.com/owner/repo
//   https://github.com/owner/repo.git
//   https://github.com/owner/repo/tree/<ref>/<path...>
//   https://github.com/owner/repo/blob/<ref>/<path...>
//   owner/repo
export function parseGithubRepoLink(input: string): GithubRef | null {
  const raw = input.trim().replace(/\.git$/, "");
  if (!raw) return null;

  const seg = "[A-Za-z0-9._-]+";
  const urlRe = new RegExp(
    `github\\.com/(${seg})/(${seg})(?:/(?:tree|blob)/([^/]+)(?:/(.*))?)?`,
  );
  const m = raw.match(urlRe);
  if (m) {
    return {
      repoFull: `${m[1]}/${m[2]}`,
      ref: m[3] ? decodeURIComponent(m[3]) : undefined,
      path: m[4] ? decodeURIComponent(m[4]).replace(/\/+$/, "") : undefined,
    };
  }

  // Bare "owner/repo"
  const bare = raw.match(new RegExp(`^(${seg})/(${seg})$`));
  if (bare) return { repoFull: `${bare[1]}/${bare[2]}` };

  return null;
}

// Detects whether a pasted link is a GitHub repo (vs a Drive link).
export function looksLikeGithub(input: string): boolean {
  return /github\.com\//i.test(input) || parseGithubRepoLink(input) !== null;
}
