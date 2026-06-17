"use client";

import { useCallback, useEffect, useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { topicsForSubject } from "@/lib/config/types";
import { useProgress } from "@/lib/useProgress";
import { createClient } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import { copyMilestoneToTodo } from "@/lib/config/mutations";
import type { ProgressTopicRow } from "@/lib/supabase/types";

type Mode = "tasks" | "milestones";

interface SectionProps {
  title: string;
  hint: string;
  variant: "list" | "path";
  topics: ProgressTopicRow[];
  done: Record<string, boolean>;
  loading: boolean;
  toggle: (id: string, done: boolean) => void;
  onGenerate: () => void;
  busy: boolean;
  canGenerate: boolean;
  buttonLabel: string;
  message: string | null;
  countNoun: string;
  // tasks only
  allowTodo?: boolean;
  linked?: Set<string>;
  onCopyTodo?: (t: ProgressTopicRow) => void;
}

function Section(props: SectionProps) {
  const {
    title, hint, variant, topics, done, loading, toggle, onGenerate, busy,
    canGenerate, buttonLabel, message, countNoun, allowTodo, linked, onCopyTodo,
  } = props;

  const completed = topics.filter((t) => done[t.id]).length;
  const total = topics.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-card border border-edge2 bg-card2/30 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {canGenerate ? (
          <button
            onClick={onGenerate}
            disabled={busy}
            className="rounded-card border border-accent px-3 py-1 text-[12.5px] text-accent transition-colors hover:bg-accentSoft disabled:opacity-50"
          >
            {busy ? "A gerar…" : buttonLabel}
          </button>
        ) : null}
        {message ? <span className="text-[12px] text-muted">{message}</span> : null}
      </div>

      {total === 0 ? (
        <p className="text-[12.5px] text-muted">{hint}</p>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[12.5px] text-muted">
                {completed} / {total} {countNoun} · {pct}%
              </div>
              <div className="mt-1.5 h-[5px] w-full max-w-[260px] overflow-hidden rounded bg-edge">
                <div
                  className="h-full rounded bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <div className="text-[20px] font-bold text-accent">{pct}%</div>
          </div>

          {variant === "path" ? (
            <ol className="relative space-y-2">
              {topics.map((t, i) => {
                const isDone = !!done[t.id];
                return (
                  <li
                    key={t.id}
                    className="flex items-start gap-3 rounded-card border border-edge bg-card px-3 py-2.5"
                  >
                    <button
                      onClick={() => toggle(t.id, !isDone)}
                      disabled={loading}
                      aria-label={isDone ? "Marcar por fazer" : "Concluir"}
                      className={[
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
                        isDone
                          ? "border-green bg-green text-white"
                          : "border-accent text-accent hover:bg-accentSoft",
                      ].join(" ")}
                    >
                      {isDone ? "✓" : i + 1}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={[
                          "text-[13.5px] font-medium",
                          isDone ? "text-muted line-through" : "",
                        ].join(" ")}
                      >
                        {t.title}
                      </div>
                      {t.description ? (
                        <div className="mt-0.5 text-[12px] text-muted">
                          {t.description}
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className="space-y-2">
              {topics.map((t) => {
                const isDone = !!done[t.id];
                const isLinked = linked?.has(t.id);
                return (
                  <div
                    key={t.id}
                    className="group flex items-start gap-2.5 rounded-card border border-edge bg-card px-3 py-2.5"
                  >
                    <button
                      onClick={() => toggle(t.id, !isDone)}
                      disabled={loading}
                      aria-label={isDone ? "Marcar por fazer" : "Concluir"}
                      className={[
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-2 text-[11px] font-bold transition-colors",
                        isDone
                          ? "border-green bg-green text-white"
                          : "border-edge hover:border-green",
                      ].join(" ")}
                    >
                      {isDone ? "✓" : ""}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div
                        className={[
                          "text-[13.5px] font-medium",
                          isDone ? "text-muted line-through" : "",
                        ].join(" ")}
                      >
                        {t.title}
                      </div>
                      {t.description ? (
                        <div className="mt-0.5 text-[12px] text-muted">
                          {t.description}
                        </div>
                      ) : null}
                    </div>
                    {allowTodo ? (
                      isLinked ? (
                        <span
                          title="Já está na lista de tarefas"
                          className="mt-0.5 shrink-0 rounded bg-accentSoft px-1.5 py-0.5 text-[10px] text-accent"
                        >
                          ✓ na lista
                        </span>
                      ) : (
                        <button
                          onClick={() => onCopyTodo?.(t)}
                          title="Adicionar à lista de tarefas"
                          aria-label="Adicionar à lista de tarefas"
                          className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] text-muted opacity-0 transition-opacity hover:bg-card2 hover:text-accent group-hover:opacity-100"
                        >
                          ➕ lista
                        </button>
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function ProgressChecklist({
  subjectId,
}: {
  subjectId: string;
}) {
  const { config, reload } = useConfig();
  const subject = config.subjects.find((s) => s.id === subjectId);
  const all = topicsForSubject(config, subjectId);
  const milestones = all.filter((t) => t.kind === "milestone");
  const tasks = all.filter((t) => t.kind !== "milestone");

  const { done, loading, ready, toggle } = useProgress();
  const aiReady = config.aiKeyPresent && Boolean(config.aiChannelId);

  const [linked, setLinked] = useState<Set<string>>(new Set());
  const [busyMode, setBusyMode] = useState<Mode | null>(null);
  const [msg, setMsg] = useState<{ mode: Mode; text: string } | null>(null);

  const loadLinked = useCallback(async () => {
    if (!HAS_SUPABASE) return;
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("notes")
        .select("topic_id")
        .not("topic_id", "is", null);
      setLinked(
        new Set(
          ((data as { topic_id: string }[] | null) ?? []).map((r) => r.topic_id),
        ),
      );
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadLinked();
  }, [loadLinked]);

  async function generate(mode: Mode) {
    setBusyMode(mode);
    setMsg(null);
    try {
      const res = await fetch("/api/milestones/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      await reload();
      setMsg({
        mode,
        text: data.added > 0 ? `Adicionados ${data.added}.` : "Nada novo gerado.",
      });
    } catch (e) {
      setMsg({ mode, text: e instanceof Error ? e.message : "Erro ao gerar" });
    } finally {
      setBusyMode(null);
    }
  }

  async function copyToTodo(t: ProgressTopicRow) {
    try {
      await copyMilestoneToTodo({
        topicId: t.id,
        title: t.title,
        subjectSlug: subject?.slug ?? null,
        description: t.description,
      });
      await loadLinked();
    } catch {
      // ignore
    }
  }

  if (!ready) {
    return (
      <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Configura o Supabase (ver <code>SETUP.md</code>) para guardar o teu
        progresso.
      </div>
    );
  }

  return (
    <div>
      {!aiReady ? (
        <p className="mb-4 rounded-card border border-edge bg-card px-3 py-2 text-[12px] text-muted">
          Configura a IA em Configuração → IA para gerares tarefas e percursos
          automaticamente.
        </p>
      ) : null}

      <div className="grid items-start gap-4 md:grid-cols-2">
        <Section
          title="Percurso de aprendizagem"
          hint="Sem percurso. Analisa os materiais para gerar um percurso ordenado."
          variant="path"
          topics={milestones}
          done={done}
          loading={loading}
          toggle={toggle}
          onGenerate={() => generate("milestones")}
          busy={busyMode === "milestones"}
          canGenerate={aiReady}
          buttonLabel="🧭 Gerar percurso"
          message={msg?.mode === "milestones" ? msg.text : null}
          countNoun="etapas"
        />

        <Section
          title="Tarefas de estudo"
          hint="Sem tarefas. Cria tarefas a partir dos materiais ou adiciona-as em Configuração → Tópicos."
          variant="list"
          topics={tasks}
          done={done}
          loading={loading}
          toggle={toggle}
          onGenerate={() => generate("tasks")}
          busy={busyMode === "tasks"}
          canGenerate={aiReady}
          buttonLabel="✅ Criar tarefas"
          message={msg?.mode === "tasks" ? msg.text : null}
          countNoun="tarefas"
          allowTodo
          linked={linked}
          onCopyTodo={copyToTodo}
        />
      </div>
    </div>
  );
}
