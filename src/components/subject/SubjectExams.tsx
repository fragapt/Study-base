"use client";

import { useMemo } from "react";
import { useExams } from "@/lib/useExams";
import { daysUntil } from "@/lib/dates";
import { examMatches } from "@/lib/constants";
import type { SubjectRow } from "@/lib/supabase/types";
import ExamCard from "@/components/exams/ExamCard";

export default function SubjectExams({ subject }: { subject: SubjectRow }) {
  const { exams, loading, error } = useExams();

  const mine = useMemo(
    () =>
      (exams ?? [])
        .filter((e) => examMatches(e.title, subject.exam_match))
        .filter((e) => daysUntil(e.start) >= 0)
        .sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [exams, subject],
  );

  if (loading) return <p className="text-[13px] text-muted">A carregar…</p>;
  if (error)
    return (
      <p className="text-[13px] text-muted">
        Liga o Google Calendar para ver os exames.
      </p>
    );
  if (mine.length === 0)
    return (
      <p className="text-[13px] text-muted">
        Sem exames próximos para esta cadeira.
      </p>
    );

  return (
    <div className="space-y-2.5">
      {mine.map((e) => (
        <ExamCard key={e.id} exam={e} />
      ))}
    </div>
  );
}
