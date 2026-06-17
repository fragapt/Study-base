// Server-only Google OAuth helpers for Calendar write access. The user's refresh
// token is stored encrypted (AES-256-GCM) and exchanged for short-lived access
// tokens here. Client id/secret + the encryption key are server-only secrets and
// never reach the browser.

import "server-only";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_TOKEN_ENC_KEY?.trim(),
  );
}

function encKey(): Buffer | null {
  const raw = (process.env.GOOGLE_TOKEN_ENC_KEY ?? "").trim();
  if (!raw) return null;
  const b = Buffer.from(raw, "base64");
  // Accept a base64 32-byte key; otherwise derive 32 bytes deterministically.
  return b.length === 32 ? b : crypto.createHash("sha256").update(raw).digest();
}

// "iv.ciphertext.tag", each base64. Returns null if no key configured.
export function encryptToken(plain: string): string | null {
  const key = encKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${enc.toString("base64")}.${tag.toString("base64")}`;
}

export function decryptToken(stored: string): string | null {
  const key = encKey();
  if (!key) return null;
  const [ivB64, dataB64, tagB64] = stored.split(".");
  if (!ivB64 || !dataB64 || !tagB64) return null;
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return dec.toString("utf8");
  } catch {
    return null;
  }
}

// Persists (encrypted) the user's refresh token. No-op if encryption isn't
// configured or the token is empty.
export async function storeRefreshToken(
  userId: string,
  refreshToken: string | null | undefined,
  scope?: string | null,
): Promise<void> {
  if (!refreshToken) return;
  const enc = encryptToken(refreshToken);
  if (!enc) return;
  const supabase = await createClient();
  await supabase.from("google_tokens").upsert({
    user_id: userId,
    refresh_token_enc: enc,
    scope: scope ?? null,
    updated_at: new Date().toISOString(),
  });
}

export async function hasGoogleToken(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("google_tokens")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

// In-memory access-token cache (access tokens last ~1h).
const cache = new Map<string, { token: string; exp: number }>();

// Returns a fresh Google access token for the user, or null if unavailable
// (not configured / not connected / refresh failed).
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  if (!googleOAuthConfigured()) return null;

  const hit = cache.get(userId);
  if (hit && hit.exp > Date.now()) return hit.token;

  const supabase = await createClient();
  const { data } = await supabase
    .from("google_tokens")
    .select("refresh_token_enc")
    .eq("user_id", userId)
    .maybeSingle();
  const enc = (data as { refresh_token_enc: string } | null)?.refresh_token_enc;
  if (!enc) return null;
  const refreshToken = decryptToken(enc);
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!.trim(),
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!.trim(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;

  cache.set(userId, {
    token: json.access_token,
    exp: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
  });
  return json.access_token;
}
