// Server-side, capped text extraction from prioritised material files (Drive +
// GitHub). Used to feed the AI milestone generator. Strictly bounded to keep
// cost/latency low.

import "server-only";
import { fetchDriveMedia, exportGoogleDoc } from "@/lib/google";
import { getRawFile } from "@/lib/github";
import { isTextPreviewable } from "@/lib/files";

const GOOGLE_DOC = "application/vnd.google-apps.document";

export const LIMITS = {
  MAX_FILES: 6,
  MAX_CHARS_PER_FILE: 8000,
  TOTAL_BUDGET: 40000,
};

export interface ExtractTarget {
  provider: "drive" | "github";
  name: string;
  mimeType: string;
  // drive
  fileId?: string;
  resourceKey?: string;
  // github
  downloadUrl?: string | null;
}

async function pdfToText(buf: ArrayBuffer): Promise<string | null> {
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const doc = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(doc, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : (text as string);
  } catch {
    return null;
  }
}

function decode(buf: ArrayBuffer): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}

// Extracts text from a single target, or null if unsupported/failed.
export async function extractText(t: ExtractTarget): Promise<string | null> {
  const isPdf = t.mimeType.includes("pdf");
  const isTextish = isTextPreviewable(t.mimeType);

  let raw: string | null = null;
  if (t.provider === "drive") {
    if (t.mimeType === GOOGLE_DOC) {
      raw = t.fileId ? await exportGoogleDoc(t.fileId) : null;
    } else if (isPdf && t.fileId) {
      const media = await fetchDriveMedia(t.fileId, t.resourceKey);
      raw = media ? await pdfToText(media.buf) : null;
    } else if (isTextish && t.fileId) {
      const media = await fetchDriveMedia(t.fileId, t.resourceKey);
      raw = media ? decode(media.buf) : null;
    }
  } else {
    if (!t.downloadUrl) return null;
    if (isPdf) {
      const res = await fetch(t.downloadUrl);
      raw = res.ok ? await pdfToText(await res.arrayBuffer()) : null;
    } else if (isTextish) {
      raw = await getRawFile(t.downloadUrl);
    }
  }

  if (!raw) return null;
  return raw.replace(/\s+\n/g, "\n").slice(0, LIMITS.MAX_CHARS_PER_FILE).trim();
}

// Extracts from a prioritised list of targets within the global budget.
export async function extractFromTargets(
  targets: ExtractTarget[],
): Promise<{ name: string; text: string }[]> {
  const out: { name: string; text: string }[] = [];
  let budget = LIMITS.TOTAL_BUDGET;
  for (const t of targets.slice(0, LIMITS.MAX_FILES)) {
    if (budget <= 0) break;
    const text = await extractText(t);
    if (text) {
      const clipped = text.slice(0, budget);
      out.push({ name: t.name, text: clipped });
      budget -= clipped.length;
    }
  }
  return out;
}
