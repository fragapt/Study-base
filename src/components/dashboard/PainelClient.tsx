"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Sparkles, BookOpen, CalendarDays, CheckSquare, Library, ChevronRight } from "lucide-react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { useStudyResourceCounts } from "@/lib/useStudyResourceCounts";
import NextExamWidget from "@/components/exams/NextExamWidget";
import TodayTodos from "@/components/todo/TodayTodos";
import CreateContentDialog from "@/components/study/CreateContentDialog";
import { STUDY_KINDS } from "@/lib/studyContent";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Boa noite";
  if (h < 13) return "Bom dia";
  if (h < 20) return "Boa tarde";
  return "Boa noite";
}

const todayLabel = new Intl.DateTimeFormat("pt-PT", {
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

export default function PainelClient() {
  const { config } = useConfig();
  const { subjects } = config;
  const { items, countBySubject } = useStudyResourceCounts();
  const [createOpen, setCreateOpen] = useState(false);

  const subjectBySlugFromId = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.id, s]));
    return m;
  }, [subjects]);

  const recent = items.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{greeting()} 👋</h1>
        <p className="mt-0.5 text-[13px] capitalize text-muted">{todayLabel}</p>
      </div>

      {/* Quick actions */}
      <div className="mb-7 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <button
          onClick={() => setCreateOpen(true)}
          className="group flex flex-col gap-2 rounded-card border border-accent/40 bg-accentSoft p-4 text-left transition-colors hover:bg-accent/20"
        >
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-[13px] font-semibold text-accent">Criar conteúdo</span>
        </button>
        <QuickLink href="/cadeiras" icon={<BookOpen className="h-5 w-5" />} label="Cadeiras" />
        <QuickLink href="/biblioteca" icon={<Library className="h-5 w-5" />} label="Biblioteca" />
        <QuickLink href="/exames" icon={<CalendarDays className="h-5 w-5" />} label="Exames" />
      </div>

      {/* Two-column content */}
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <NextExamWidget />
          <TodayTodos />
        </div>

        <div>
          {/* Cadeiras */}
          <section className="mb-7">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-muted">Cadeiras</h2>
              <Link href="/cadeiras" className="text-[12px] text-accent hover:underline">
                Ver todas →
              </Link>
            </div>
            {subjects.length === 0 ? (
              <div className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
                Sem cadeiras.{" "}
                <Link href="/configuracao" className="text-accent hover:underline">
                  Configurar
                </Link>
                .
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {subjects.map((s) => {
                  const n = countBySubject.get(s.id) ?? 0;
                  return (
                    <Link
                      key={s.id}
                      href={`/cadeiras/${s.slug}`}
                      className="flex flex-col gap-1 rounded-card border border-edge bg-card p-3 transition-colors hover:bg-card2"
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="truncate text-[12.5px] font-medium leading-snug">
                        {s.name}
                      </span>
                      {n > 0 ? (
                        <span className="text-[11px] text-muted">{n} na biblioteca</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Conteúdo recente */}
          {recent.length > 0 ? (
            <section className="mb-7">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-muted">Conteúdo recente</h2>
                <Link href="/biblioteca" className="text-[12px] text-accent hover:underline">
                  Biblioteca →
                </Link>
              </div>
              <div className="space-y-1.5">
                {recent.map((r) => {
                  const s = subjectBySlugFromId.get(r.subject_id);
                  const icon = STUDY_KINDS.find((k) => k.kind === r.kind)?.icon ?? "📄";
                  return (
                    <Link
                      key={r.id}
                      href={s ? `/biblioteca/${s.slug}` : "/biblioteca"}
                      className="group flex items-center gap-2.5 rounded-card border border-edge bg-card px-3 py-2 transition-colors hover:bg-card2"
                    >
                      <span className="text-base">{icon}</span>
                      <span className="min-w-0 flex-1 truncate text-[13px]">{r.title}</span>
                      {s ? <span className="shrink-0 text-[11px] text-muted">{s.icon}</span> : null}
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-dim group-hover:text-accent" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      <CreateContentDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-card border border-edge bg-card p-4 text-muted transition-colors hover:border-accent/40 hover:bg-card2 hover:text-fg"
    >
      {icon}
      <span className="text-[13px] font-semibold">{label}</span>
    </Link>
  );
}
