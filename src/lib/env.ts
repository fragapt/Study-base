// Centralised env access. Public values are inlined by Next at build time;
// server-only secrets are read lazily inside server code paths.

// Defensively clean a pasted env value: trim whitespace and strip a single pair
// of surrounding quotes (a very common mistake when setting vars in a dashboard).
function clean(v: string | undefined): string {
  if (!v) return "";
  let s = v.trim();
  if (s.length >= 2 && /^(["']).*\1$/.test(s)) s = s.slice(1, -1).trim();
  return s;
}

function isValidHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Treat Supabase as configured only when the URL is actually a valid URL and a
// key is present. A malformed value (e.g. missing https://, stray quotes) is
// treated as "not configured" so the app shell still renders instead of 500ing
// when @supabase/ssr rejects the URL.
export const HAS_SUPABASE =
  isValidHttpUrl(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 0;

export function requireServerEnv(name: string): string {
  const v = clean(process.env[name]);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
