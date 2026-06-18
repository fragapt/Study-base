"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useStudyResources } from "@/lib/useStudyResources";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CreateContentDialog from "./CreateContentDialog";
import StudyResourceCard from "./StudyResourceCard";
import StudyResourceView from "./StudyResourceView";
import type { StudyContent } from "@/lib/studyContent";
import type { StudyResourceRow } from "@/lib/supabase/types";

export default function SubjectLibraryClient({ subjectId }: { subjectId: string }) {
  const { resources, loading, add, remove } = useStudyResources(subjectId);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewing, setViewing] = useState<StudyResourceRow | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Criar conteúdo
        </Button>
      </div>

      {loading ? (
        <p className="text-[13px] text-muted">A carregar…</p>
      ) : resources.length === 0 ? (
        <p className="rounded-card border border-edge bg-card p-6 text-center text-[13px] text-muted">
          Ainda não há conteúdo guardado para esta cadeira.
          <br />
          Usa <span className="text-accent">Criar conteúdo</span> para gerar resumos,
          flashcards, quizzes ou mapas mentais.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <StudyResourceCard
              key={r.id}
              resource={r}
              onOpen={() => setViewing(r)}
              onDelete={() => remove(r.id)}
            />
          ))}
        </div>
      )}

      <CreateContentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultSubjectId={subjectId}
        lockSubject
        onGenerated={(r) => add(r)}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing ? (
            <StudyResourceView content={viewing.content as StudyContent} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
