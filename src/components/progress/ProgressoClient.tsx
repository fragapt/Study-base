"use client";

import { useState } from "react";
import { SUBJECTS } from "@/lib/constants";
import ProgressChecklist from "./ProgressChecklist";

export default function ProgressoClient() {
  const [slug, setSlug] = useState(SUBJECTS[0].slug);
  const subject = SUBJECTS.find((s) => s.slug === slug)!;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s.slug}
            onClick={() => setSlug(s.slug)}
            className={[
              "rounded-card border px-3 py-1.5 text-[13px] transition-colors",
              s.slug === slug
                ? "border-accent bg-accentSoft text-accent"
                : "border-edge text-muted hover:bg-card2 hover:text-fg",
            ].join(" ")}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>
      <ProgressChecklist subjectName={subject.name} subjectSlug={subject.slug} />
    </div>
  );
}
