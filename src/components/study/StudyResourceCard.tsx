"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STUDY_KINDS, type StudyKind } from "@/lib/studyContent";
import type { StudyResourceRow } from "@/lib/supabase/types";

function kindMeta(kind: string) {
  return STUDY_KINDS.find((k) => k.kind === (kind as StudyKind)) ?? {
    icon: "📄",
    label: kind,
  };
}

export default function StudyResourceCard({
  resource,
  onOpen,
  onDelete,
}: {
  resource: StudyResourceRow;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const meta = kindMeta(resource.kind);
  const sources = (resource.sources as { name?: string }[] | null) ?? [];
  const date = new Date(resource.created_at).toLocaleDateString("pt-PT");

  return (
    <div className="group flex flex-col rounded-card border border-edge bg-card p-3 transition-colors hover:border-accent/50">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-base">{meta.icon}</span>
        <Badge variant="muted">{meta.label}</Badge>
        <span className="ml-auto text-[11px] text-dim">{date}</span>
      </div>
      <button
        onClick={onOpen}
        className="mb-1 text-left text-[13.5px] font-medium leading-snug text-fg hover:text-accent"
      >
        {resource.title}
      </button>
      {sources.length ? (
        <p className="mb-2 line-clamp-2 text-[11px] text-muted">
          {sources.map((s) => s.name).filter(Boolean).join(" · ")}
        </p>
      ) : null}
      <div className="mt-auto flex items-center justify-between pt-1">
        <button
          onClick={onOpen}
          className="text-[12px] text-accent hover:underline"
        >
          Abrir →
        </button>
        <button
          onClick={onDelete}
          aria-label="Eliminar"
          className="text-dim opacity-0 transition-opacity hover:text-red group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
