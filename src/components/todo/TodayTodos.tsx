"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useNotes } from "@/lib/useNotes";
import NoteItem from "./NoteItem";

export default function TodayTodos() {
  const { notes, loading, ready, toggleDone, deleteNote } = useNotes();

  const open = useMemo(() => {
    const today = new Date(new Date().toDateString());
    return notes
      .filter((n) => !n.done)
      .sort((a, b) => {
        const ad = a.due_date ? +new Date(a.due_date) : Infinity;
        const bd = b.due_date ? +new Date(b.due_date) : Infinity;
        return ad - bd;
      })
      .slice(0, 4)
      .map((n) => ({
        ...n,
        _overdue: n.due_date ? new Date(n.due_date) < today : false,
      }));
  }, [notes]);

  if (!ready) return null;

  return (
    <section className="mb-7">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-muted">Tarefas em aberto</h2>
        <Link href="/todo" className="text-[12px] text-accent hover:underline">
          Ver to-do →
        </Link>
      </div>
      {loading ? (
        <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          A carregar…
        </div>
      ) : open.length === 0 ? (
        <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          Nada pendente. 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {open.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              onToggle={toggleDone}
              onDelete={deleteNote}
            />
          ))}
        </div>
      )}
    </section>
  );
}
