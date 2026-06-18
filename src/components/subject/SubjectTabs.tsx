"use client";

import { useConfig } from "@/lib/config/ConfigProvider";
import { usePersistedState } from "@/lib/usePersistedState";
import { subjectBySlug } from "@/lib/config/types";
import SubjectMaterials from "./SubjectMaterials";
import TodoClient from "@/components/todo/TodoClient";
import ProgressChecklist from "@/components/progress/ProgressChecklist";

type Tab = "materiais" | "notas" | "progresso";

const TABS: { key: Tab; label: string }[] = [
  { key: "materiais", label: "Materiais" },
  { key: "notas", label: "Notas" },
  { key: "progresso", label: "Progresso" },
];

export default function SubjectTabs({ slug }: { slug: string }) {
  const { config } = useConfig();
  const subject = subjectBySlug(config, slug);
  const [stored, setTab] = usePersistedState<Tab>("bde.cadeira.tab", "materiais");
  // Guard against a stale value (e.g. the removed "exames" tab).
  const tab: Tab = TABS.some((t) => t.key === stored) ? stored : "materiais";

  if (!subject) return null;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "rounded-card border px-3 py-1.5 text-[13px] transition-colors",
              tab === t.key
                ? "border-accent bg-accentSoft text-accent"
                : "border-edge text-muted hover:bg-card2 hover:text-fg",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "materiais" ? (
        <SubjectMaterials subjectId={subject.id} />
      ) : null}
      {tab === "notas" ? <TodoClient fixedSubject={subject.slug} /> : null}
      {tab === "progresso" ? (
        <ProgressChecklist subjectId={subject.id} />
      ) : null}
    </div>
  );
}
