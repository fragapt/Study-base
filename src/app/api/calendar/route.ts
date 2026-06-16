import { NextResponse } from "next/server";
import { listCalendarEvents, isExam } from "@/lib/google";
import { EXAM_CALENDAR_ID } from "@/lib/constants";
import type { ExamDTO } from "@/lib/exam";

// GET /api/calendar → upcoming exams (every event on the dedicated calendar).
export async function GET() {
  const calendarId = process.env.EXAM_CALENDAR_ID || EXAM_CALENDAR_ID;
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
