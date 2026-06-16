import { SUBJECT_BY_SLUG } from "@/lib/constants";

export default function SubjectBadge({ slug }: { slug: string | null }) {
  if (!slug) return null;
  const s = SUBJECT_BY_SLUG[slug];
  if (!s) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ background: `${s.color}24`, color: s.color }}
    >
      {s.icon} {s.name}
    </span>
  );
}
