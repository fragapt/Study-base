"use client";

import { useMemo, useState } from "react";
import { useNotes } from "@/lib/useNotes";
import { SUBJECTS } from "@/lib/constants";
import NoteItem from "./NoteItem";

export default function TodoClient({
  fixedSubject,
}: {
  fixedSubject?: string;
}) {
  const { notes, loading, error, ready, addNote, toggleDone, deleteNote } =
    useNotes();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState(fixedSubject ?? "");
  const [due, setDue] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [filterSubject, setFilterSubject] = useState("");
  const [showDone, setShowDone] = useState(false);

  const visible = useMemo(() => {
    return notes.filter((n) => {
      if (fixedSubject && n.subject_slug !== fixedSubject) return false;
      if (filterSubject && n.subject_slug !== filterSubject) return false;
      if (!showDone && n.done) return false;
      return true;
    });
  }, [notes, fixedSubject, filterSubject, showDone]);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      await addNote({
        title: title.trim(),
        description: description.trim() || null,
        subject_slug: subject || null,
        due_date: due || null,
      });
      setTitle("");
      setDescription("");
      setDue("");
      if (!fixedSubject) setSubject("");
      setShowDetails(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Configura o Supabase (ver <code>SETUP.md</code>) para guardar tarefas
        sincronizadas.
      </div>
    );
  }

  return (
    <div>
      {/* Add form */}
      <div className="mb-5 rounded-card border border-edge bg-card p-3">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showDetails) submit();
            }}
            placeholder="Nova tarefa…"
            className="flex-1 rounded-card border border-edge bg-app px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={() => setShowDetails((s) => !s)}
            className="rounded-card border border-edge px-3 text-[13px] text-muted hover:bg-card2 hover:text-fg"
            title="Detalhes"
          >
            ⋯
          </button>
          <button
            onClick={submit}
            disabled={saving || !title.trim()}
            className="rounded-card bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a6dc0] disabled:opacity-50"
          >
            + Adicionar
          </button>
        </div>

        {showDetails ? (
          <div className="mt-2.5 space-y-2.5">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)…"
              rows={2}
              className="w-full resize-y rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
            />
            <div className="flex flex-wrap gap-2.5">
              {!fixedSubject ? (
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
                >
                  <option value="">— Sem cadeira —</option>
                  {SUBJECTS.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="rounded-card border border-edge bg-app px-3 py-2 text-[13px] text-muted outline-none focus:border-accent"
              />
            </div>
          </div>
        ) : null}
        {formError ? (
          <p className="mt-2 text-[12px] text-red">{formError}</p>
        ) : null}
      </div>

      {/* Filters */}
      {!fixedSubject ? (
        <div className="mb-3 flex flex-wrap items-center gap-2.5">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="rounded-card border border-edge bg-card px-3 py-1.5 text-[13px] outline-none focus:border-accent"
          >
            <option value="">Todas as cadeiras</option>
            {SUBJECTS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={showDone}
              onChange={(e) => setShowDone(e.target.checked)}
            />
            Mostrar concluídas
          </label>
        </div>
      ) : null}

      {/* List */}
      {loading ? (
        <p className="py-3 text-[13px] text-muted">A carregar…</p>
      ) : error ? (
        <p className="py-3 text-[13px] text-red">{error}</p>
      ) : visible.length === 0 ? (
        <div className="py-10 text-center text-[13px] text-muted">
          <div className="mb-2 text-3xl">✅</div>
          Sem tarefas.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((n) => (
            <NoteItem
              key={n.id}
              note={n}
              onToggle={toggleDone}
              onDelete={deleteNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
