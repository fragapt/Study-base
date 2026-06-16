import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SUBJECT_BY_SLUG, SUBJECTS } from "@/lib/constants";
import SubjectTabs from "@/components/subject/SubjectTabs";

export function generateStaticParams() {
  return SUBJECTS.map((s) => ({ subject: s.slug }));
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const def = SUBJECT_BY_SLUG[subject];
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
