import type { ExamDTO } from "@/lib/exam";
import { dayMonth, daysUntil, formatTime } from "@/lib/dates";

export default function ExamCard({ exam }: { exam: ExamDTO }) {
  const days = daysUntil(exam.start);
  const { day, month } = dayMonth(exam.start);
  const isToday = days === 0;
  const isPast = days < 0;

  return (
    <div
      className={[
        "flex items-center gap-4 rounded-card border px-4 py-3 transition-colors",
        isToday
          ? "border-accent bg-accentSoft"
          : "border-edge bg-card hover:bg-card2",
        isPast ? "opacity-45" : "",
      ].join(" ")}
    >
      <div className="min-w-[46px] text-center">
        <div className="text-[21px] font-bold leading-none">{day}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted">
          {month}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{exam.title}</div>
        <div className="mt-0.5 flex flex-wrap gap-2.5 text-[12px] text-muted">
          {!exam.allDay ? <span>🕐 {formatTime(exam.start)}</span> : null}
          {exam.location ? <span>📍 {exam.location}</span> : null}
        </div>
      </div>

      <div className="min-w-[56px] shrink-0 text-right">
        {isToday ? (
          <div className="text-[12px] font-bold text-orange">HOJE</div>
        ) : isPast ? (
          <div className="text-[11px] font-semibold text-muted">passou</div>
        ) : (
          <>
            <div className="text-[20px] font-bold leading-none text-accent">
              {days}
            </div>
            <div className="text-[11px] text-muted">
              {days === 1 ? "dia" : "dias"}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
