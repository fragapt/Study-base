// @vitest-environment node
import { describe, it, expect, vi, beforeAll } from "vitest";

// The module imports the server Supabase client at top-level; stub it so the
// pure crypto helpers can be tested in isolation.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { encryptToken, decryptToken } from "./googleOAuth";

beforeAll(() => {
  process.env.GOOGLE_TOKEN_ENC_KEY = Buffer.alloc(32, 9).toString("base64");
});

describe("token encryption", () => {
  it("round-trips a refresh token", () => {
    const enc = encryptToken("1//refresh-token-value");
    expect(enc).toBeTruthy();
    expect(enc).not.toContain("refresh-token-value");
    expect(decryptToken(enc!)).toBe("1//refresh-token-value");
  });

  it("uses a random IV (same input → different ciphertext)", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });

  it("returns null on tampered/garbage input", () => {
    expect(decryptToken("not.valid.data")).toBeNull();
    expect(decryptToken("garbage")).toBeNull();
  });
});
