import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { loadUserConfig } from "@/lib/userConfig";
import { foldersForSubject } from "@/lib/config/types";

export default async function CadeirasPage() {
  const config = await loadUserConfig();
  const { subjects } = config;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Cadeiras"
        subtitle="Cada cadeira tem o seu espaço: materiais, notas, progresso e exames."
      />
      {subjects.length === 0 ? (
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
            const count = foldersForSubject(config, s.id).length;
            return (
              <Link
                key={s.slug}
                href={`/cadeiras/${s.slug}`}
                className="flex items-center gap-3 rounded-card border border-edge bg-card p-4 transition-colors hover:bg-card2"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-card text-lg"
                  style={{ background: `${s.color}24` }}
                >
                  {s.icon}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{s.name}</div>
                  <div className="text-[12px] text-muted">
                    {count} pasta{count !== 1 ? "s" : ""} ligada
                    {count !== 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
