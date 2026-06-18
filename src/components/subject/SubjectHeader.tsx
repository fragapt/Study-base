"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { useExams } from "@/lib/useExams";
import { examMatches } from "@/lib/constants";
import { daysUntil, dayMonth } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import CreateContentDialog from "@/components/study/CreateContentDialog";
import type { SubjectRow } from "@/lib/supabase/types";

export default function SubjectHeader({ subject }: { subject: SubjectRow }) {
  const { exams } = useExams();
  const [createOpen, setCreateOpen] = useState(false);

  const next = useMemo(
    () =>
      (exams ?? [])
        .filter((e) => examMatches(e.title, subject.exam_match))
        .filter((e) => daysUntil(e.start) >= 0)
        .sort((a, b) => +new Date(a.start) - +new Date(b.start))[0],
    [exams, subject],
  );

  const days = next ? daysUntil(next.start) : null;
  const dm = next ? dayMonth(next.start) : null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <Link
        href={`/biblioteca/${subject.slug}`}
        className="inline-flex items-center gap-1.5 rounded-card border border-edge px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        <BookOpen className="h-3.5 w-3.5" /> Conteúdo gerado
      </Link>
      <Button size="sm" onClick={() => setCreateOpen(true)}>
        <Plus className="h-4 w-4" /> Criar conteúdo
      </Button>

      {next && dm ? (
        <Link
          href="/exames"
          title={next.title}
          className="ml-auto inline-flex items-center gap-2 rounded-card border border-accent/40 bg-accentSoft px-3 py-1.5 text-[12.5px] text-accent"
        >
          <span className="text-muted">Próximo exame</span>
          <span className="font-semibold">
            {dm.day} {dm.month}
          </span>
          <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[11px] font-bold">
            {days === 0 ? "hoje" : `${days}d`}
          </span>
        </Link>
      ) : null}

      <CreateContentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultSubjectId={subject.id}
        lockSubject
      />
    </div>
  );
}
