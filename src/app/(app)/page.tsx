import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { DRIVES, SUBJECTS } from "@/lib/constants";
import NextExamWidget from "@/components/exams/NextExamWidget";
import TodayTodos from "@/components/todo/TodayTodos";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Dashboard"
        subtitle="Próximo exame, tarefas de hoje e atalhos para as tuas drives."
      />

      <NextExamWidget />
      <TodayTodos />

      {/* Drive shortcuts */}
      <section className="mb-7">
        <h2 className="mb-2.5 text-[13px] font-semibold text-muted">Drives</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {DRIVES.map((d) => (
            <Link
              key={d.key}
              href={`/drives?drive=${d.key}`}
              className="flex items-center gap-3 rounded-card border border-edge bg-card p-4 transition-colors hover:bg-card2"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="truncate text-sm font-semibold">{d.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Subjects quick access */}
      <section className="mb-7">
        <h2 className="mb-2.5 text-[13px] font-semibold text-muted">Cadeiras</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {SUBJECTS.map((s) => (
            <Link
              key={s.slug}
              href={`/cadeiras/${s.slug}`}
              className="flex flex-col gap-1 rounded-card border border-edge bg-card p-3 transition-colors hover:bg-card2"
            >
              <span className="text-lg">{s.icon}</span>
              <span className="text-[12.5px] font-medium leading-snug">
                {s.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
