"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useConfig } from "@/lib/config/ConfigProvider";
import { foldersForSubject, topicsForSubject } from "@/lib/config/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import SourceFileTree from "./SourceFileTree";
import { STUDY_KINDS, type StudyKind } from "@/lib/studyContent";
import { targetFromDriveFile, targetKey, type DriveFile, type MaterialTarget } from "@/lib/files";
import type { StudyResourceRow } from "@/lib/supabase/types";

type SourceTab = "docs" | "tasks" | "milestones";

export interface CreateContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubjectId?: string;
  lockSubject?: boolean;
  defaultDocuments?: MaterialTarget[];
  defaultTopicIds?: string[];
  onGenerated?: (resource: StudyResourceRow) => void;
}

export default function CreateContentDialog({
  open,
  onOpenChange,
  defaultSubjectId,
  lockSubject,
  defaultDocuments,
  defaultTopicIds,
  onGenerated,
}: CreateContentDialogProps) {
  const { config } = useConfig();
  const subjects = config.subjects;
  const aiReady = config.aiKeyPresent && Boolean(config.aiChannelId);

  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? "");
  const [tab, setTab] = useState<SourceTab>("docs");
  const [docs, setDocs] = useState<Map<string, MaterialTarget>>(new Map());
  const [topics, setTopics] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<StudyKind>("resumo");
  const [objective, setObjective] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset (and seed any pre-selected sources) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const sid = defaultSubjectId ?? subjects[0]?.id ?? "";
    setSubjectId(sid);

    const seededDocs = new Map<string, MaterialTarget>();
    (defaultDocuments ?? []).forEach((t) => seededDocs.set(targetKey(t), t));
    setDocs(seededDocs);
    const seededTopics = new Set(defaultTopicIds ?? []);
    setTopics(seededTopics);

    // Open the tab matching the seeded source.
    let initialTab: SourceTab = "docs";
    if (seededDocs.size === 0 && seededTopics.size > 0) {
      const subjectTopics = sid ? topicsForSubject(config, sid) : [];
      const anyMilestone = subjectTopics.some(
        (t) => seededTopics.has(t.id) && t.kind === "milestone",
      );
      initialTab = anyMilestone ? "milestones" : "tasks";
    }
    setTab(initialTab);

    setKind("resumo");
    setObjective("");
    setError(null);
    setBusy(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultSubjectId, subjects]);

  const folders = subjectId ? foldersForSubject(config, subjectId) : [];
  const allTopics = subjectId ? topicsForSubject(config, subjectId) : [];
  const tasks = allTopics.filter((t) => t.kind !== "milestone");
  const milestones = allTopics.filter((t) => t.kind === "milestone");

  function toggleDoc(file: DriveFile) {
    const target = targetFromDriveFile(file);
    if (!target) return;
    const key = targetKey(target);
    setDocs((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, target);
      return next;
    });
  }

  function toggleTopic(id: string) {
    setTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function changeSubject(id: string) {
    setSubjectId(id);
    setDocs(new Map());
    setTopics(new Set());
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/study/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          subjectId,
          kind,
          objective,
          topicIds: [...topics],
          documents: [...docs.values()],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar");
      onGenerated?.(data.resource as StudyResourceRow);
      onOpenChange(false);
      toast.success("Conteúdo guardado na Biblioteca.");
    } catch (e) {
      const m = e instanceof Error ? e.message : "Erro ao gerar";
      setError(m);
      toast.error(m);
    } finally {
      setBusy(false);
    }
  }

  const lockedSubject = subjects.find((s) => s.id === subjectId);
  const count = docs.size + topics.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar conteúdo</DialogTitle>
          <DialogDescription>
            Escolhe a cadeira, as fontes e o tipo de material a gerar.
          </DialogDescription>
        </DialogHeader>

        {!aiReady ? (
          <p className="rounded-card border border-edge bg-card2/40 px-3 py-2 text-[12px] text-muted">
            Configura a IA em Configuração → IA para gerar conteúdo.
          </p>
        ) : null}

        <div className="space-y-3">
          {/* Cadeira */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted">Cadeira</label>
            {lockSubject ? (
              <div className="rounded-card border border-edge bg-app px-3 py-2 text-[13px]">
                {lockedSubject?.icon} {lockedSubject?.name}
              </div>
            ) : (
              <select
                value={subjectId}
                onChange={(e) => changeSubject(e.target.value)}
                className="w-full rounded-card border border-edge bg-app px-3 py-2 text-[13px] text-fg outline-none focus:border-accent"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.icon} {s.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fontes */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted">
              Fontes{" "}
              {count > 0 ? (
                <span className="text-accent">· {count} selecionada{count !== 1 ? "s" : ""}</span>
              ) : (
                <span className="text-dim">· nenhuma = toda a cadeira</span>
              )}
            </label>
            <div className="mb-2 flex gap-1.5">
              {([
                ["docs", `Documentos${docs.size ? ` (${docs.size})` : ""}`],
                ["tasks", `Tarefas${countIn(topics, tasks)} `],
                ["milestones", `Percurso${countIn(topics, milestones)}`],
              ] as [SourceTab, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={[
                    "rounded-card border px-2.5 py-1 text-[12px] transition-colors",
                    tab === t
                      ? "border-accent bg-accentSoft text-accent"
                      : "border-edge text-muted hover:bg-card2",
                  ].join(" ")}
                >
                  {label.trim()}
                </button>
              ))}
            </div>

            {tab === "docs" ? (
              <SourceFileTree folders={folders} selected={docs} onToggle={toggleDoc} />
            ) : (
              <TopicCheckList
                topics={tab === "tasks" ? tasks : milestones}
                selected={topics}
                onToggle={toggleTopic}
                emptyLabel={tab === "tasks" ? "Sem tarefas." : "Sem percurso."}
              />
            )}
          </div>

          {/* Tipo */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted">Tipo de material</label>
            <div className="grid grid-cols-4 gap-2">
              {STUDY_KINDS.map((k) => (
                <button
                  key={k.kind}
                  onClick={() => setKind(k.kind)}
                  className={[
                    "flex flex-col items-center gap-1 rounded-card border px-2 py-2 text-[12px] transition-colors",
                    kind === k.kind
                      ? "border-accent bg-accentSoft text-accent"
                      : "border-edge text-muted hover:bg-card2",
                  ].join(" ")}
                >
                  <span className="text-lg">{k.icon}</span>
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instruções */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted">
              Instruções (opcional)
            </label>
            <Textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex.: preparar teste em 5 dias; foca nos conceitos principais; nível introdutório…"
            />
          </div>

          {error ? <p className="text-[12px] text-red">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={generate} disabled={busy || !aiReady || !subjectId}>
            {busy ? "A gerar…" : "Gerar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function countIn(selected: Set<string>, topics: { id: string }[]): string {
  const n = topics.filter((t) => selected.has(t.id)).length;
  return n ? ` (${n})` : "";
}

function TopicCheckList({
  topics,
  selected,
  onToggle,
  emptyLabel,
}: {
  topics: { id: string; title: string }[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  emptyLabel: string;
}) {
  if (topics.length === 0) {
    return <p className="py-2 text-[12px] text-muted">{emptyLabel}</p>;
  }
  return (
    <div className="max-h-[240px] space-y-1 overflow-y-auto rounded-card border border-edge2 bg-app p-1.5">
      {topics.map((t) => (
        <label
          key={t.id}
          className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1 text-[13px] hover:bg-card2"
        >
          <input
            type="checkbox"
            checked={selected.has(t.id)}
            onChange={() => onToggle(t.id)}
            className="mt-0.5 h-3.5 w-3.5 accent-[var(--accent)]"
          />
          <span className="flex-1 leading-snug">{t.title}</span>
        </label>
      ))}
    </div>
  );
}
