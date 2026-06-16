// Server-side Google REST helpers. Keyless reads of PUBLIC Drive folders and a
// PUBLIC calendar using a restricted API key. Never import this from client code.

import "server-only";

const DRIVE_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const CAL_BASE = "https://www.googleapis.com/calendar/v3/calendars";

function apiKey(): string {
  let k = (process.env.GOOGLE_API_KEY ?? "").trim();
  // Strip a single pair of surrounding quotes (common dashboard paste mistake).
  if (k.length >= 2 && /^(["']).*\1$/.test(k)) k = k.slice(1, -1).trim();
  if (!k) throw new Error("Missing GOOGLE_API_KEY");
  return k;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
  // Legacy link-shared items require this key to be fetched (see below).
  resourceKey?: string;
  // Present when the item is a shortcut; lets us follow it to the real target.
  shortcutDetails?: {
    targetId?: string;
    targetMimeType?: string;
    targetResourceKey?: string;
  };
}

export function isFolder(mimeType: string) {
  return mimeType === "application/vnd.google-apps.folder";
}

// List immediate children of a public Drive folder.
//
// Legacy (pre-2017) link-shared folders — e.g. NEEM's `0B7x…` IDs — return
// nothing unless their resource key is supplied via the
// `X-Goog-Drive-Resource-Keys` header (format: `<fileId>/<resourceKey>`).
// We also request `shortcutDetails` so shortcuts can be followed to their target.
export async function listDriveFolder(
  folderId: string,
  resourceKey?: string,
): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    key: apiKey(),
    fields:
      "files(id,name,mimeType,webViewLink,thumbnailLink,modifiedTime,size,resourceKey,shortcutDetails(targetId,targetMimeType,targetResourceKey))",
    orderBy: "folder,name",
    pageSize: "200",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });

  const headers: Record<string, string> = {};
  if (resourceKey) {
    headers["X-Goog-Drive-Resource-Keys"] = `${folderId}/${resourceKey}`;
  }

  const res = await fetch(`${DRIVE_ENDPOINT}?${params}`, {
    headers,
    // Cache listings briefly to keep the tree snappy without going stale.
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

// List upcoming events from a public calendar (already expanded to instances).
export async function listCalendarEvents(
  calendarId: string,
  opts: { daysAhead?: number; daysBehind?: number } = {},
): Promise<CalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - (opts.daysBehind ?? 30));
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + (opts.daysAhead ?? 200));

  const params = new URLSearchParams({
    key: apiKey(),
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: "250",
  });

  const res = await fetch(
    `${CAL_BASE}/${encodeURIComponent(calendarId)}/events?${params}`,
    { next: { revalidate: 600 } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Calendar API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { items?: CalendarEvent[] };
  return data.items ?? [];
}

// The configured calendar is dedicated to exams, so every event on it counts
// as an exam. We only skip malformed entries that have no start date/time.
export function isExam(ev: CalendarEvent) {
  return Boolean(ev.start && (ev.start.dateTime || ev.start.date));
}
