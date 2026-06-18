import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { loadUserConfig } from "@/lib/userConfig";
import { subjectBySlug } from "@/lib/config/types";
import SubjectLibraryClient from "@/components/study/SubjectLibraryClient";

export default async function SubjectLibraryPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const config = await loadUserConfig();
  const def = subjectBySlug(config, subject);
  if (!def) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/biblioteca"
        className="mb-3 inline-block text-[12px] text-muted hover:text-fg"
      >
        ← Biblioteca
      </Link>
      <PageHeader
        title={`${def.icon} ${def.name}`}
        subtitle="Conteúdo de estudo gerado para esta cadeira."
      />
      <SubjectLibraryClient subjectId={def.id} />
    </div>
  );
}
