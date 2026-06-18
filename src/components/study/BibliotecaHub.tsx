"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, FolderOpen, ChevronRight } from "lucide-react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { usePersistedState } from "@/lib/usePersistedState";
import { useStudyResourceCounts } from "@/lib/useStudyResourceCounts";
import DrivesClient from "@/components/drives/DrivesClient";
import CreateContentDialog from "./CreateContentDialog";
import { Button } from "@/components/ui/button";

type Tab = "conteudo" | "ficheiros";

export default function BibliotecaHub() {
  const { config } = useConfig();
  const subjects = config.subjects;
  const params = useSearchParams();
  const [tab, setTab] = usePersistedState<Tab>("bde.biblioteca.tab", "conteudo");
  const { countBySubject, reload } = useStudyResourceCounts();
  const [createOpen, setCreateOpen] = useState(false);

  // The /drives redirect lands here with ?tab=ficheiros.
  useEffect(() => {
    const t = params.get("tab");
    if (t === "ficheiros" || t === "conteudo") setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          {([
            ["conteudo", "Conteúdo gerado"],
            ["ficheiros", "Ficheiros"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "rounded-card border px-3 py-1.5 text-[13px] transition-colors",
                tab === t
                  ? "border-accent bg-accentSoft text-accent"
                  : "border-edge text-muted hover:bg-card2 hover:text-fg",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" className="ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Criar conteúdo
        </Button>
      </div>

      {tab === "conteudo" ? (
        subjects.length === 0 ? (
          <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
            Sem cadeiras. Cria-as em{" "}
            <Link href="/configuracao" className="text-accent hover:underline">
              Configuração
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {subjects.map((s) => {
              const n = countBySubject.get(s.id) ?? 0;
              return (
                <Link
                  key={s.id}
                  href={`/biblioteca/${s.slug}`}
                  className="group flex items-center gap-3 rounded-card border border-edge bg-card p-4 transition-colors hover:border-accent/50 hover:bg-card2"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-lg"
                    style={{ background: `${s.color}24` }}
                  >
                    {s.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{s.name}</div>
                    <div className="text-[12px] text-muted">
                      {n} {n === 1 ? "item" : "itens"} de estudo
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              );
            })}
          </div>
        )
      ) : subjects.length === 0 && config.drives.length === 0 ? (
        <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          <FolderOpen className="mr-1 inline h-4 w-4" /> Sem fontes. Adiciona drives ou
          repositórios em{" "}
          <Link href="/configuracao" className="text-accent hover:underline">
            Configuração
          </Link>
          .
        </p>
      ) : (
        <DrivesClient />
      )}

      <CreateContentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onGenerated={() => reload()}
      />
    </div>
  );
}
