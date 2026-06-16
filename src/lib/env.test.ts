import { describe, it, expect, afterEach, vi } from "vitest";

// env.ts reads process.env at module-evaluation time, so each case stubs the
// environment then imports a fresh copy of the module.
async function loadEnv() {
  vi.resetModules();
  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env", () => {
  it("treats a valid https URL + key as configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    const env = await loadEnv();
    expect(env.HAS_SUPABASE).toBe(true);
    expect(env.SUPABASE_URL).toBe("https://abc.supabase.co");
  });

  it("strips surrounding quotes from a pasted URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", '"https://abc.supabase.co"');
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    const env = await loadEnv();
    expect(env.SUPABASE_URL).toBe("https://abc.supabase.co");
    expect(env.HAS_SUPABASE).toBe(true);
  });

  it("is not configured when the URL is malformed (missing protocol)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    const env = await loadEnv();
    expect(env.HAS_SUPABASE).toBe(false);
  });

  it("is not configured when the URL is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
    const env = await loadEnv();
    expect(env.HAS_SUPABASE).toBe(false);
  });
});
