import { NextResponse } from "next/server";
import { listCalendarEvents, isExam } from "@/lib/google";
import { createClient } from "@/lib/supabase/server";
import { HAS_SUPABASE } from "@/lib/env";
import type { AppSettingsRow } from "@/lib/supabase/types";
import type { ExamDTO } from "@/lib/exam";

// GET /api/calendar → upcoming exams from the current user's configured calendar.
export async function GET() {
  let calendarId: string | null = null;

  if (HAS_SUPABASE) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("app_settings")
        .select("exam_calendar_id")
        .eq("user_id", user.id)
        .maybeSingle();
      calendarId = (data as Pick<AppSettingsRow, "exam_calendar_id"> | null)
        ?.exam_calendar_id ?? null;
    }
  }
  // Local-dev fallback when Supabase isn't configured.
  if (!calendarId) calendarId = process.env.EXAM_CALENDAR_ID || null;

  // No calendar configured → return an empty list (the UI shows "no exams").
  if (!calendarId) return NextResponse.json({ exams: [] });

  try {
    const events = await listCalendarEvents(calendarId, {
      daysAhead: 220,
      daysBehind: 30,
    });
    const exams: ExamDTO[] = events.filter(isExam).map((ev) => {
      const dateTime = ev.start.dateTime;
      const date = ev.start.date;
      return {
        id: ev.id,
        title: ev.summary,
        start: dateTime || date || "",
        allDay: !dateTime,
        location: ev.location,
        description: ev.description,
      };
    });
    return NextResponse.json({ exams });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
