import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { listCalendarEvents, isExam } from "@/lib/google";
import { EXAM_CALENDAR_ID } from "@/lib/constants";
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

  const calendarId = process.env.EXAM_CALENDAR_ID || EXAM_CALENDAR_ID;
  const events = await listCalendarEvents(calendarId, { daysAhead: 10, daysBehind: 0 });
  const due = events
    .filter(isExam)
    .map((ev) => ({
      ev,
      days: daysUntil(ev.start.dateTime || ev.start.date || ""),
    }))
    .filter(({ days }) => days in OFFSETS);

  if (due.length === 0) return NextResponse.json({ sent: 0, reason: "no exams due" });

  const supabase = createServiceClient();
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

  let sent = 0;

  for (const [userId, userSubs] of byUser) {
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
