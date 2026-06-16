"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { topicsForSubject } from "@/lib/config/types";
import { addTopic, deleteTopic } from "@/lib/config/mutations";

function SubjectTopics({ subjectId }: { subjectId: string }) {
  const { config, reload } = useConfig();
  const topics = topicsForSubject(config, subjectId);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function remove(id: string) {
    await deleteTopic(id);
    await reload();
  }

  return (
    <div>
      {topics.length > 0 ? (
        <ul className="mb-2 space-y-1">
          {topics.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-[12.5px]">
              <span className="truncate">{t.title}</span>
              <button
                onClick={() => remove(t.id)}
                className="ml-auto shrink-0 rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-[12px] text-muted">Sem tópicos.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Novo tópico"
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
