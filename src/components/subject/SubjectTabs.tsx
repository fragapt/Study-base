"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { subjectBySlug } from "@/lib/config/types";
import SubjectMaterials from "./SubjectMaterials";
import SubjectExams from "./SubjectExams";
import TodoClient from "@/components/todo/TodoClient";
import ProgressChecklist from "@/components/progress/ProgressChecklist";

type Tab = "materiais" | "notas" | "progresso" | "exames";

const TABS: { key: Tab; label: string }[] = [
  { key: "materiais", label: "Materiais" },
  { key: "notas", label: "Notas" },
  { key: "progresso", label: "Progresso" },
  { key: "exames", label: "Exames" },
];

export default function SubjectTabs({ slug }: { slug: string }) {
  const { config } = useConfig();
  const subject = subjectBySlug(config, slug);
  const [tab, setTab] = useState<Tab>("materiais");

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
      {tab === "exames" ? <SubjectExams subject={subject} /> : null}
    </div>
  );
}
