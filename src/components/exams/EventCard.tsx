"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { CalendarEventDTO } from "@/lib/exam";
import { dayMonth, daysUntil, formatTime } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";

// Calendar row used on the Exames page for both the read-only exam feed and the
// editable Google events (which get tags + edit/delete actions).
export default function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEventDTO;
  onEdit?: (e: CalendarEventDTO) => void;
  onDelete?: (e: CalendarEventDTO) => void;
}) {
  const days = daysUntil(event.start);
  const { day, month } = dayMonth(event.start);
  const isToday = days === 0;
  const isPast = days < 0;

  return (
    <div
      className={[
        "group flex items-center gap-4 rounded-card border px-4 py-3 transition-colors",
        isToday ? "border-accent bg-accentSoft" : "border-edge bg-card hover:bg-card2",
        isPast ? "opacity-45" : "",
      ].join(" ")}
    >
      <div className="min-w-[46px] text-center">
        <div className="text-[21px] font-bold leading-none">{day}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted">{month}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{event.title}</span>
          {!event.editable ? <Badge variant="muted">exame</Badge> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2.5 text-[12px] text-muted">
          {!event.allDay ? <span>🕐 {formatTime(event.start)}</span> : null}
          {event.location ? <span>📍 {event.location}</span> : null}
          {event.tags.map((t) => (
            <Badge key={t} variant="outline">
              #{t}
            </Badge>
          ))}
        </div>
      </div>

      {event.editable && (onEdit || onDelete) ? (
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit ? (
            <button
              onClick={() => onEdit(event)}
              aria-label="Editar"
              className="rounded p-1 text-muted hover:bg-card2 hover:text-accent"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              onClick={() => onDelete(event)}
              aria-label="Eliminar"
              className="rounded p-1 text-muted hover:bg-card2 hover:text-red"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="min-w-[56px] shrink-0 text-right">
        {isToday ? (
          <div className="text-[12px] font-bold text-orange">HOJE</div>
        ) : isPast ? (
          <div className="text-[11px] font-semibold text-muted">passou</div>
        ) : (
          <>
            <div className="text-[20px] font-bold leading-none text-accent">{days}</div>
            <div className="text-[11px] text-muted">{days === 1 ? "dia" : "dias"}</div>
          </>
        )}
      </div>
    </div>
  );
}
