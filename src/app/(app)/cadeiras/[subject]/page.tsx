import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { loadUserConfig } from "@/lib/userConfig";
import { subjectBySlug } from "@/lib/config/types";
import SubjectTabs from "@/components/subject/SubjectTabs";

// Subjects are per-user, so this route is resolved dynamically (no static params).
export default async function SubjectPage({
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
        href="/cadeiras"
        className="mb-3 inline-block text-[12px] text-muted hover:text-fg"
      >
        ← Cadeiras
      </Link>
      <PageHeader title={`${def.icon} ${def.name}`} />
      <SubjectTabs slug={def.slug} />
    </div>
  );
}
