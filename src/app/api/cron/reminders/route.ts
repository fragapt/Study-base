import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { listCalendarEvents, isExam, type CalendarEvent } from "@/lib/google";
import { daysUntil } from "@/lib/dates";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFSETS: Record<number, { kind: string; text: (t: string) => string }> = {
  3: { kind: "3d", text: (t) => `Faltam 3 dias para ${t}` },
  1: { kind: "1d", text: (t) => `É amanhã: ${t}` },
  0: { kind: "day", text: (t) => `Hoje: ${t}` },
};

interface Sub {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface DueExam {
  ev: CalendarEvent;
  days: number;
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "VAPID em falta" }, { status: 500 });
  }
  webpush.setVapidDetails(subject, vapidPublic, vapidPrivate);

  const supabase = createServiceClient();

  // Push subscriptions grouped by user.
  const { data: subsData } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth");
  const subs = (subsData ?? []) as Sub[];
  const byUser = new Map<string, Sub[]>();
  subs.forEach((s) => {
    const list = byUser.get(s.user_id) ?? [];
    list.push(s);
    byUser.set(s.user_id, list);
  });
  if (byUser.size === 0) return NextResponse.json({ sent: 0, reason: "no subs" });

  // Each user's configured calendar.
  const { data: settingsData } = await supabase
    .from("app_settings")
    .select("user_id, exam_calendar_id");
  const calendarByUser = new Map<string, string>();
  (settingsData ?? []).forEach(
    (r: { user_id: string; exam_calendar_id: string | null }) => {
      if (r.exam_calendar_id) calendarByUser.set(r.user_id, r.exam_calendar_id);
    },
  );

  // Cache calendar lookups so users sharing a calendar fetch it once.
  const dueByCalendar = new Map<string, DueExam[]>();
  async function getDue(calendarId: string): Promise<DueExam[]> {
    const cached = dueByCalendar.get(calendarId);
    if (cached) return cached;
    const events = await listCalendarEvents(calendarId, {
      daysAhead: 10,
      daysBehind: 0,
    });
    const due = events
      .filter(isExam)
      .map((ev) => ({ ev, days: daysUntil(ev.start.dateTime || ev.start.date || "") }))
      .filter(({ days }) => days in OFFSETS);
    dueByCalendar.set(calendarId, due);
    return due;
  }

  let sent = 0;

  for (const [userId, userSubs] of byUser) {
    const calendarId = calendarByUser.get(userId);
    if (!calendarId) continue;

    let due: DueExam[];
    try {
      due = await getDue(calendarId);
    } catch {
      continue; // skip a user whose calendar fetch fails
    }

    for (const { ev, days } of due) {
      const off = OFFSETS[days];
      const examUid = ev.id;

      // Dedupe: skip if this (user, exam, offset) was already sent.
      const { data: existing } = await supabase
        .from("sent_reminders")
        .select("id")
        .eq("user_id", userId)
        .eq("exam_uid", examUid)
        .eq("offset_kind", off.kind)
        .maybeSingle();
      if (existing) continue;

      const payload = JSON.stringify({
        title: "Exame em aproximação",
        body: off.text(ev.summary),
        url: "/exames",
        tag: `${examUid}-${off.kind}`,
      });

      for (const s of userSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
      }

      await supabase.from("sent_reminders").insert({
        user_id: userId,
        exam_uid: examUid,
        offset_kind: off.kind,
      });
    }
  }

  return NextResponse.json({ sent });
}
