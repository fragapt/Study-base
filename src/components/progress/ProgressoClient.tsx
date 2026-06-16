"use client";

import { useState } from "react";
import Link from "next/link";
import { useConfig } from "@/lib/config/ConfigProvider";
import ProgressChecklist from "./ProgressChecklist";

export default function ProgressoClient() {
  const { config } = useConfig();
  const subjects = config.subjects;
  const [slug, setSlug] = useState(subjects[0]?.slug ?? "");
  const subject = subjects.find((s) => s.slug === slug) ?? subjects[0];

  if (subjects.length === 0) {
    return (
      <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Sem cadeiras. Cria-as em{" "}
        <Link href="/configuracao" className="text-accent hover:underline">
          Configuração
        </Link>
        .
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s.slug}
            onClick={() => setSlug(s.slug)}
            className={[
              "rounded-card border px-3 py-1.5 text-[13px] transition-colors",
              s.slug === subject.slug
                ? "border-accent bg-accentSoft text-accent"
                : "border-edge text-muted hover:bg-card2 hover:text-fg",
            ].join(" ")}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>
      <ProgressChecklist subjectId={subject.id} />
    </div>
  );
}
