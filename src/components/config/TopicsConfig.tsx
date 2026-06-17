"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { topicsForSubject } from "@/lib/config/types";
import {
  addTopic,
  deleteTopic,
  updateTopic,
  deleteTopicsForSubject,
} from "@/lib/config/mutations";
import Modal from "@/components/Modal";
import type { ProgressTopicRow } from "@/lib/supabase/types";

function EditTopicModal({
  topic,
  onClose,
  onSaved,
}: {
  topic: ProgressTopicRow;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [title, setTitle] = useState(topic.title);
  const [desc, setDesc] = useState(topic.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await updateTopic(topic.id, {
        title: title.trim(),
        description: desc.trim() || null,
      });
      await onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={topic.kind === "milestone" ? "Editar etapa" : "Editar tarefa"}
      onClose={onClose}
    >
      <div className="space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="w-full rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={3}
          className="w-full resize-y rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-card border border-edge px-3 py-1.5 text-[13px] text-muted hover:bg-card2 hover:text-fg"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={busy}
            className="rounded-card bg-accent px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-[#1a6dc0] disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SubjectTopics({ subjectId }: { subjectId: string }) {
  const { config, reload } = useConfig();
  const topics = topicsForSubject(config, subjectId);
  const milestones = topics.filter((t) => t.kind === "milestone");
  const tasks = topics.filter((t) => t.kind !== "milestone");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<ProgressTopicRow | null>(null);

  async function add() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addTopic({
        subject_id: subjectId,
        title: title.trim(),
        description: desc.trim() || null,
      });
      await reload();
      setTitle("");
      setDesc("");
    } finally {
      setBusy(false);
    }
  }

  async function clearKind(kind: "task" | "milestone", label: string) {
    if (!window.confirm(`Eliminar ${label}? Esta ação não pode ser anulada.`)) {
      return;
    }
    await deleteTopicsForSubject(subjectId, kind);
    await reload();
  }

  async function remove(id: string) {
    await deleteTopic(id);
    await reload();
  }

  function row(t: ProgressTopicRow) {
    return (
      <li key={t.id} className="flex items-center gap-2 text-[12.5px]">
        {t.kind === "milestone" ? (
          <span className="shrink-0 rounded bg-accentSoft px-1 text-[10px] text-accent">
            🧭
          </span>
        ) : null}
        <span className="truncate">{t.title}</span>
        <button
          onClick={() => setEditing(t)}
          className="ml-auto shrink-0 rounded px-2 py-0.5 text-[11px] text-muted hover:bg-card2 hover:text-fg"
        >
          Editar
        </button>
        <button
          onClick={() => remove(t.id)}
          className="shrink-0 rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
        >
          Remover
        </button>
      </li>
    );
  }

  return (
    <div>
      {/* Percurso */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[12px] font-semibold text-muted">Percurso</span>
        {milestones.length > 0 ? (
          <button
            onClick={() => clearKind("milestone", "todo o percurso")}
            className="ml-auto rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
          >
            Eliminar percurso
          </button>
        ) : null}
      </div>
      {milestones.length > 0 ? (
        <ul className="mb-3 space-y-1">{milestones.map(row)}</ul>
      ) : (
        <p className="mb-3 text-[12px] text-muted">Sem etapas.</p>
      )}

      {/* Tarefas */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-[12px] font-semibold text-muted">Tarefas</span>
        {tasks.length > 0 ? (
          <button
            onClick={() => clearKind("task", "todas as tarefas")}
            className="ml-auto rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
          >
            Eliminar tarefas
          </button>
        ) : null}
      </div>
      {tasks.length > 0 ? (
        <ul className="mb-2 space-y-1">{tasks.map(row)}</ul>
      ) : (
        <p className="mb-2 text-[12px] text-muted">Sem tarefas.</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nova tarefa"
          className="w-[160px] rounded-card border border-edge bg-app px-3 py-1.5 text-[13px] outline-none focus:border-accent"
        />
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Descrição (opcional)"
          className="min-w-[160px] flex-1 rounded-card border border-edge bg-app px-3 py-1.5 text-[13px] outline-none focus:border-accent"
        />
        <button
          onClick={add}
          disabled={busy}
          className="rounded-card border border-edge px-3 py-1.5 text-[12px] text-muted hover:bg-card2 hover:text-fg disabled:opacity-50"
        >
          + Adicionar
        </button>
      </div>

      {editing ? (
        <EditTopicModal
          topic={editing}
          onClose={() => setEditing(null)}
          onSaved={reload}
        />
      ) : null}
    </div>
  );
}

export default function TopicsConfig() {
  const { config } = useConfig();

  if (config.subjects.length === 0) {
    return <p className="text-[12px] text-muted">Cria cadeiras primeiro.</p>;
  }

  return (
    <div className="space-y-4">
      {config.subjects.map((s) => (
        <div key={s.id} className="rounded-card border border-edge bg-app p-3">
          <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
            <span>{s.icon}</span> {s.name}
          </div>
          <SubjectTopics subjectId={s.id} />
        </div>
      ))}
    </div>
  );
}
