"use client";

import { useConfig } from "@/lib/config/ConfigProvider";
import { topicsForSubject } from "@/lib/config/types";
import { useProgress } from "@/lib/useProgress";

export default function ProgressChecklist({
  subjectId,
}: {
  subjectId: string;
}) {
  const { config } = useConfig();
  const topics = topicsForSubject(config, subjectId);
  const { done, loading, ready, toggle } = useProgress();

  const completed = topics.filter((t) => done[t.id]).length;
  const total = topics.length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  if (!ready) {
    return (
      <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Configura o Supabase (ver <code>SETUP.md</code>) para guardar o teu
        progresso.
      </div>
    );
  }

  if (total === 0) {
    return (
      <p className="text-[13px] text-muted">
        Sem tópicos definidos para esta cadeira. Adiciona-os em Configuração →
        Tópicos de estudo.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-[13px] text-muted">
            {completed} / {total} tópicos · {pct}% completo
          </div>
          <div className="mt-1.5 h-[5px] w-full max-w-[260px] overflow-hidden rounded bg-edge">
            <div
              className="h-full rounded bg-accent transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="text-[22px] font-bold text-accent">{pct}%</div>
      </div>

      <div className="space-y-2">
        {topics.map((t) => {
          const isDone = !!done[t.id];
          return (
            <div
              key={t.id}
              className="flex items-start gap-2.5 rounded-card border border-edge bg-card px-3 py-2.5"
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
