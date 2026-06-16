import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { loadUserConfig } from "@/lib/userConfig";
import NextExamWidget from "@/components/exams/NextExamWidget";
import TodayTodos from "@/components/todo/TodayTodos";

export default async function DashboardPage() {
  const { drives, subjects } = await loadUserConfig();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Dashboard"
        subtitle="Próximo exame, tarefas de hoje e atalhos para as tuas drives."
      />

      <NextExamWidget />
      <TodayTodos />

      {drives.length === 0 && subjects.length === 0 ? (
        <section className="mb-7 rounded-card border border-edge bg-card p-5 text-[13px] text-muted">
          Ainda não tens nada configurado. Vai a{" "}
          <Link href="/configuracao" className="text-accent hover:underline">
            Configuração
          </Link>{" "}
          para adicionar as tuas drives, cadeiras e calendário (ou importar a
          configuração de exemplo).
        </section>
      ) : null}

      {/* Drive shortcuts */}
      {drives.length > 0 ? (
        <section className="mb-7">
          <h2 className="mb-2.5 text-[13px] font-semibold text-muted">Drives</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {drives.map((d) => (
              <Link
                key={d.id}
                href={`/drives?drive=${d.id}`}
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
      ) : null}

      {/* Subjects quick access */}
      {subjects.length > 0 ? (
        <section className="mb-7">
          <h2 className="mb-2.5 text-[13px] font-semibold text-muted">Cadeiras</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {subjects.map((s) => (
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
      ) : null}
    </div>
  );
}
