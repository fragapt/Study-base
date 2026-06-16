import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SUBJECTS } from "@/lib/constants";

export default function CadeirasPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Cadeiras"
        subtitle="Cada cadeira tem o seu espaço: materiais, notas, progresso e exames."
      />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUBJECTS.map((s) => (
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
                {Object.keys(s.folders).length} drive
                {Object.keys(s.folders).length !== 1 ? "s" : ""} ligada
                {Object.keys(s.folders).length !== 1 ? "s" : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
