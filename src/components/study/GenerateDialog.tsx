"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { STUDY_KINDS, type StudyKind } from "@/lib/studyContent";
import type { MaterialTarget } from "@/lib/files";
import type { StudyResourceRow } from "@/lib/supabase/types";

export interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  topicIds?: string[];
  documents?: MaterialTarget[];
  sourceLabels?: string[];
  onGenerated?: (resource: StudyResourceRow) => void;
}

// Shared "generate study content" dialog: pick a type, give a free-text
// objective, and generate from the supplied topics/documents (or, if none, the
// whole subject's materials).
export default function GenerateDialog({
  open,
  onOpenChange,
  subjectId,
  topicIds = [],
  documents = [],
  sourceLabels = [],
  onGenerated,
}: GenerateDialogProps) {
  const [kind, setKind] = useState<StudyKind>("resumo");
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scope =
    sourceLabels.length > 0
      ? sourceLabels.join(", ")
      : "todos os materiais da cadeira";

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/study/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, kind, objective, topicIds, documents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar");
      onGenerated?.(data.resource as StudyResourceRow);
      setObjective("");
      onOpenChange(false);
      toast.success("Conteúdo guardado na Biblioteca.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao gerar";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar conteúdo de estudo</DialogTitle>
          <DialogDescription>
            A partir de: <span className="text-fg">{scope}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-muted">
              Tipo de conteúdo
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STUDY_KINDS.map((k) => (
                <button
                  key={k.kind}
                  onClick={() => setKind(k.kind)}
                  className={[
                    "flex flex-col items-center gap-1 rounded-card border px-2 py-2.5 text-[12px] transition-colors",
                    kind === k.kind
                      ? "border-accent bg-accentSoft text-accent"
                      : "border-edge text-muted hover:bg-card2 hover:text-fg",
                  ].join(" ")}
                >
                  <span className="text-lg">{k.icon}</span>
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-muted">
              Objetivo (opcional)
            </label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex.: preparar um teste daqui a 5 dias; compreender o conceito de X; preparar uma apresentação sobre Y…"
            />
          </div>

          {error ? <p className="text-[12px] text-red">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={generate} disabled={busy}>
            {busy ? "A gerar…" : "Gerar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
