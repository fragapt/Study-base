"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useExams } from "@/lib/useExams";
import { daysUntil } from "@/lib/dates";
import ExamCard from "./ExamCard";

export default function NextExamWidget() {
  const { exams, loading, error } = useExams();

  const next = useMemo(() => {
    return (exams ?? [])
      .filter((e) => daysUntil(e.start) >= 0)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0];
  }, [exams]);

  return (
    <section className="mb-7">
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-muted">Próximo exame</h2>
        <Link href="/exames" className="text-[12px] text-accent hover:underline">
          Ver todos →
        </Link>
      </div>
      {loading ? (
        <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          A carregar…
        </div>
      ) : error ? (
        <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          Liga o Google Calendar para ver os exames.
        </div>
      ) : next ? (
        <ExamCard exam={next} />
      ) : (
        <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          Sem exames próximos.
        </div>
      )}
    </section>
  );
}
