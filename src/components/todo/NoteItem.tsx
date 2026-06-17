"use client";

import type { NoteRow } from "@/lib/supabase/types";
import SubjectBadge from "./SubjectBadge";

export default function NoteItem({
  note,
  onToggle,
  onDelete,
}: {
  note: NoteRow;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const overdue =
    note.due_date && !note.done && new Date(note.due_date) < new Date(new Date().toDateString());

  return (
    <div className="flex items-start gap-2.5 rounded-card border border-edge bg-card px-3 py-2.5">
      <button
        onClick={() => onToggle(note.id, !note.done)}
        aria-label={note.done ? "Marcar por fazer" : "Concluir"}
        className={[
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 text-[11px] font-bold transition-colors",
          note.done
            ? "border-accent bg-accent text-white"
            : "border-edge hover:border-accent",
        ].join(" ")}
      >
        {note.done ? "✓" : ""}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={[
            "text-[13.5px] leading-snug",
            note.done ? "text-muted line-through" : "",
          ].join(" ")}
        >
          {note.title}
        </div>
        {note.description ? (
          <div className="mt-0.5 whitespace-pre-wrap text-[12px] text-muted">
            {note.description}
          </div>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <SubjectBadge slug={note.subject_slug} />
          {note.topic_id ? (
            <span
              title="Ligada a uma tarefa de estudo — estado sincronizado"
              className="rounded bg-accentSoft px-1.5 py-0.5 text-[11px] font-medium text-accent"
            >
              🎯 estudo
            </span>
          ) : null}
          {note.due_date ? (
            <span
              className={[
                "text-[11px]",
                overdue ? "text-red" : "text-muted",
              ].join(" ")}
            >
              📅 {note.due_date}
            </span>
          ) : null}
        </div>
      </div>

      <button
        onClick={() => onDelete(note.id)}
        aria-label="Eliminar"
        className="shrink-0 text-lg leading-none text-dim transition-colors hover:text-red"
      >
        ×
      </button>
    </div>
  );
}
