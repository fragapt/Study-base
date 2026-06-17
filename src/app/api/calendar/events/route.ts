import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessToken } from "@/lib/googleOAuth";
import {
  listAuthedEvents,
  createAuthedEvent,
  updateAuthedEvent,
  deleteAuthedEvent,
  type AuthedEvent,
  type EventWrite,
} from "@/lib/google";
import type { CalendarEventDTO } from "@/lib/exam";

export const runtime = "nodejs";

function toDTO(ev: AuthedEvent): CalendarEventDTO {
  const dateTime = ev.start?.dateTime;
  const date = ev.start?.date;
  const tagsRaw = ev.extendedProperties?.private?.tags ?? "";
  return {
    id: ev.id,
    title: ev.summary || "(sem título)",
    start: dateTime || date || "",
    end: ev.end?.dateTime || ev.end?.date || undefined,
    allDay: !dateTime,
    location: ev.location,
    description: ev.description,
    tags: tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    editable: true,
  };
}

async function ctx() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sem sessão" as const, status: 401 };
  const token = await getGoogleAccessToken(user.id);
  if (!token)
    return { error: "Liga o Google Calendar em Configuração." as const, status: 400 };
  const { data } = await supabase
    .from("app_settings")
    .select("write_calendar_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const calendarId =
    (data as { write_calendar_id: string | null } | null)?.write_calendar_id ||
    "primary";
  return { token, calendarId };
}

// GET → editable events from the user's calendar (or {connected:false}).
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ connected: false, events: [] });
  const token = await getGoogleAccessToken(user.id);
  if (!token) return NextResponse.json({ connected: false, events: [] });

  const { data } = await supabase
    .from("app_settings")
    .select("write_calendar_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const calendarId =
    (data as { write_calendar_id: string | null } | null)?.write_calendar_id ||
    "primary";

  try {
    const events = (await listAuthedEvents(token, calendarId)).map(toDTO);
    return NextResponse.json({ connected: true, events });
  } catch (e) {
    return NextResponse.json(
      { connected: true, events: [], error: e instanceof Error ? e.message : "Erro" },
      { status: 502 },
    );
  }
}

function readBody(raw: unknown): EventWrite | null {
  const b = raw as Partial<EventWrite> | null;
  if (!b || typeof b.summary !== "string" || !b.summary.trim()) return null;
  if (typeof b.start !== "string" || !b.start) return null;
  return {
    summary: b.summary.trim(),
    description: b.description,
    location: b.location,
    start: b.start,
    end: b.end,
    allDay: Boolean(b.allDay),
    tags: Array.isArray(b.tags) ? b.tags : [],
  };
}

export async function POST(request: NextRequest) {
  const c = await ctx();
  if ("error" in c) return NextResponse.json({ error: c.error }, { status: c.status });
  const input = readBody(await request.json().catch(() => null));
  if (!input)
    return NextResponse.json({ error: "Título e data são obrigatórios" }, { status: 400 });
  try {
    const event = toDTO(await createAuthedEvent(c.token, c.calendarId, input));
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 502 });
  }
}

export async function PATCH(request: NextRequest) {
  const c = await ctx();
  if ("error" in c) return NextResponse.json({ error: c.error }, { status: c.status });
  const raw = (await request.json().catch(() => null)) as ({ id?: string } & Partial<EventWrite>) | null;
  const id = raw?.id;
  const input = readBody(raw);
  if (!id || !input)
    return NextResponse.json({ error: "id, título e data são obrigatórios" }, { status: 400 });
  try {
    const event = toDTO(await updateAuthedEvent(c.token, c.calendarId, id, input));
    return NextResponse.json({ event });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  const c = await ctx();
  if ("error" in c) return NextResponse.json({ error: c.error }, { status: c.status });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório" }, { status: 400 });
  try {
    await deleteAuthedEvent(c.token, c.calendarId, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro" }, { status: 502 });
  }
}
