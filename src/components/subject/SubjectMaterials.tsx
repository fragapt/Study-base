"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { driveById, foldersForSubject } from "@/lib/config/types";
import { DriveFile } from "@/lib/files";
import { rootFromSubjectFolder } from "@/lib/sourceTree";
import DriveTree from "@/components/drives/DriveTree";
import FilePreview from "@/components/drives/FilePreview";

export default function SubjectMaterials({ subjectId }: { subjectId: string }) {
  const { config } = useConfig();
  const folders = foldersForSubject(config, subjectId);
  const [selected, setSelected] = useState<DriveFile | null>(null);

  if (folders.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Nenhuma pasta ligada a esta cadeira. Liga pastas em Configuração →
        Pastas por cadeira.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-2.5">
        {folders.map((f) => {
          const drive = driveById(config, f.drive_id);
          const label = drive?.name ?? f.name ?? "Pasta";
          const color = drive?.color ?? "#2383e2";
          return (
            <div
              key={f.id}
              className="overflow-hidden rounded-card border border-edge bg-card"
            >
              <div className="flex items-center gap-2.5 border-b border-edge2 px-4 py-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: color }}
                />
                <span className="text-[13px] font-semibold">{label}</span>
                {f.name && drive ? (
                  <span className="truncate text-[12px] text-muted">
                    · {f.name}
                  </span>
                ) : null}
              </div>
              <div className="py-1">
                <DriveTree
                  root={rootFromSubjectFolder(f)}
                  selectedId={selected?.id}
                  onSelect={setSelected}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block">
        <div className="sticky top-2 h-[calc(100dvh-9rem)]">
          <FilePreview file={selected} />
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-app p-3 md:hidden">
          <div className="h-full">
            <FilePreview file={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
