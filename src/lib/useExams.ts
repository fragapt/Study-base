"use client";

import { useEffect, useState } from "react";
import type { ExamDTO } from "./exam";

export function useExams() {
  const [exams, setExams] = useState<ExamDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/calendar");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erro ao carregar exames");
        if (alive) setExams(data.exams as ExamDTO[]);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Erro");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { exams, loading, error };
}
