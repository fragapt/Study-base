// Server-side AI milestone generation via the IAedu agent API. The user's key +
// channel id are read here only (server) — they never reach the browser. The
// endpoint streams newline-delimited JSON events; we read the full body and
// extract the assistant's message.

import "server-only";
import { createClient } from "@/lib/supabase/server";

const IAEDU_ENDPOINT =
  process.env.IAEDU_ENDPOINT ||
  "https://api.iaedu.pt/agent-chat//api/v1/agent/cmoss7l0f658oko01vk2egfpg/stream";

export interface AiCredentials {
  key: string;
  channelId: string;
}

// Resolves the IAedu key + channel id for a user: their stored values, else env
// fallback. Reads the secret key only here (server).
export async function getAiCredentials(
  userId: string,
): Promise<AiCredentials | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("ai_api_key, ai_channel_id")
    .eq("user_id", userId)
    .maybeSingle();

  const row = data as { ai_api_key: string | null; ai_channel_id: string | null } | null;
  const key =
    (row?.ai_api_key ?? "").trim() || (process.env.IAEDU_API_KEY ?? "").trim();
  const channelId =
    (row?.ai_channel_id ?? "").trim() || (process.env.IAEDU_CHANNEL_ID ?? "").trim();
  if (!key || !channelId) return null;
  return { key, channelId };
}

export interface AiMilestone {
  title: string;
  description: string;
}

// Extracts the JSON milestone array from text (tolerates fences/prose).
export function parseMilestones(text: string): AiMilestone[] {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((m) => {
      const o = m as { title?: unknown; description?: unknown };
      return {
        title: typeof o.title === "string" ? o.title.trim() : "",
        description: typeof o.description === "string" ? o.description.trim() : "",
      };
    })
    .filter((m) => m.title.length > 0)
    .slice(0, 25);
}

// Reduces the IAedu stream body (newline-delimited JSON events) to the assistant
// text: prefers the final `message` event, falling back to concatenated tokens.
export function extractAssistantText(raw: string): string {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let message: string | null = null;
  const tokens: string[] = [];
  for (const line of lines) {
    let ev: { type?: string; content?: unknown };
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.type === "token" && typeof ev.content === "string") {
      tokens.push(ev.content);
    } else if (ev.type === "message") {
      const c = ev.content;
      if (typeof c === "string") message = c;
      else if (c && typeof (c as { content?: unknown }).content === "string") {
        message = (c as { content: string }).content;
      }
    }
  }
  return (message ?? tokens.join("")).trim();
}

// Sends a fully-composed prompt (instruction + materials) to the agent and
// parses the JSON milestone/task array from the reply.
export async function callAiForMilestones(
  prompt: string,
  creds: AiCredentials,
): Promise<AiMilestone[]> {
  const form = new FormData();
  form.append("channel_id", creds.channelId);
  form.append("thread_id", crypto.randomUUID());
  form.append("user_info", "{}");
  form.append("message", prompt);

  // Note: do NOT set Content-Type — fetch adds the multipart boundary itself.
  const res = await fetch(IAEDU_ENDPOINT, {
    method: "POST",
    headers: { "x-api-key": creds.key },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`IA ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const text = extractAssistantText(await res.text());
  return parseMilestones(text);
}
