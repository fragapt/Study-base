"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { usePersistedState } from "@/lib/usePersistedState";
import { topicsForSubject } from "@/lib/config/types";
import { useStudyResources } from "@/lib/useStudyResources";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GenerateDialog from "./GenerateDialog";
import StudyResourceCard from "./StudyResourceCard";
import StudyResourceView from "./StudyResourceView";
import type { RetrievalHit, StudyContent } from "@/lib/studyContent";
import type { StudyResourceRow } from "@/lib/supabase/types";

export default function BibliotecaClient() {
  const { config } = useConfig();
  const subjects = config.subjects;
  const [subjectId, setSubjectId] = usePersistedState<string>(
    "bde.biblioteca.subject",
    subjects[0]?.id ?? "",
  );
  const aiReady = config.aiKeyPresent && Boolean(config.aiChannelId);
  const topics = useMemo(
    () => topicsForSubject(config, subjectId),
    [config, subjectId],
  );
  const { resources, loading, add, remove } = useStudyResources(subjectId || null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<RetrievalHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [gen, setGen] = useState<{ topicIds: string[]; labels: string[] } | null>(null);
  const [viewing, setViewing] = useState<StudyResourceRow | null>(null);

  if (subjects.length === 0) {
    return (
      <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Sem cadeiras. Adiciona-as em{" "}
        <Link href="/configuracao" className="text-accent hover:underline">
          Configuração
        </Link>
        .
      </p>
    );
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setHits(null);
    try {
      const res = await fetch("/api/study/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subjectId, query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na pesquisa");
      setHits(data.hits as RetrievalHit[]);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Erro na pesquisa");
    } finally {
      setSearching(false);
    }
  }

  const selectedLabels = topics
    .filter((t) => selected.has(t.id))
    .map((t) => t.title);

  return (
    <div className="space-y-6">
      {/* Subject picker */}
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => {
              setSubjectId(s.id);
              setSelected(new Set());
              setHits(null);
            }}
            className={[
              "rounded-card border px-3 py-1.5 text-[13px] transition-colors",
              subjectId === s.id
                ? "border-accent bg-accentSoft text-accent"
                : "border-edge text-muted hover:bg-card2 hover:text-fg",
            ].join(" ")}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>

      {!aiReady ? (
        <p className="rounded-card border border-edge bg-card px-3 py-2 text-[12px] text-muted">
          Configura a IA em{" "}
          <Link href="/configuracao" className="text-accent hover:underline">
            Configuração → IA
          </Link>{" "}
          para pesquisar materiais e gerar conteúdo.
        </p>
      ) : null}

      {/* Topic search → which materials cover it */}
      <section className="rounded-card border border-edge bg-card p-4">
        <h2 className="mb-2 text-sm font-semibold">Pesquisar materiais por tópico</h2>
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Ex.: integrais por partes, normalização de bases de dados…"
          />
          <Button onClick={runSearch} disabled={searching || !aiReady || !query.trim()}>
            <Search className="h-4 w-4" /> {searching ? "A procurar…" : "Procurar"}
          </Button>
        </div>
        {searchError ? (
          <p className="mt-2 text-[12px] text-red">{searchError}</p>
        ) : null}
        {hits ? (
          hits.length ? (
            <ul className="mt-3 space-y-1.5">
              {hits.map((h, i) => (
                <li key={i} className="rounded-card border border-edge2 bg-card2/40 px-3 py-2">
                  <div className="text-[13px] font-medium text-fg">📄 {h.name}</div>
                  {h.reason ? (
                    <div className="text-[12px] text-muted">{h.reason}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[12px] text-muted">
              Nenhum material relevante encontrado.
            </p>
          )
        ) : null}
      </section>

      {/* Select topics → generate */}
      <section className="rounded-card border border-edge bg-card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Gerar conteúdo</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!aiReady || selected.size === 0}
              onClick={() =>
                setGen({ topicIds: [...selected], labels: selectedLabels })
              }
            >
              <Sparkles className="h-4 w-4" /> Dos selecionados ({selected.size})
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!aiReady}
              onClick={() => setGen({ topicIds: [], labels: [] })}
            >
              De toda a cadeira
            </Button>
          </div>
        </div>
        {topics.length === 0 ? (
          <p className="text-[12px] text-muted">
            Sem tópicos. Cria tarefas ou um percurso na{" "}
            <Link href="/progresso" className="text-accent hover:underline">
              área de Progresso
            </Link>
            , ou gera de toda a cadeira.
          </p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2">
            {topics.map((t) => (
              <label
                key={t.id}
                className="flex cursor-pointer items-start gap-2 rounded-card border border-edge2 bg-card2/30 px-2.5 py-2 text-[13px] hover:border-accent/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className="mt-0.5 accent-[var(--accent)]"
                />
                <span className="flex-1 leading-snug">{t.title}</span>
                {t.kind === "milestone" ? (
                  <Badge variant="muted">🧭</Badge>
                ) : null}
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Saved library */}
      <section>
        <h2 className="mb-2 text-sm font-semibold">Biblioteca</h2>
        {loading ? (
          <p className="text-[13px] text-muted">A carregar…</p>
        ) : resources.length === 0 ? (
          <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
            Ainda não há conteúdo guardado para esta cadeira.
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
      </section>

      {gen ? (
        <GenerateDialog
          open={!!gen}
          onOpenChange={(o) => !o && setGen(null)}
          subjectId={subjectId}
          topicIds={gen.topicIds}
          sourceLabels={gen.labels}
          onGenerated={(r) => {
            add(r);
            setSelected(new Set());
          }}
        />
      ) : null}

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
