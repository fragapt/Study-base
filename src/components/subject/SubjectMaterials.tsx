"use client";

import { useState } from "react";
import { DRIVE_BY_KEY, DriveKey, SubjectFolderMap } from "@/lib/constants";
import { DriveFile } from "@/lib/files";
import DriveTree from "@/components/drives/DriveTree";
import FilePreview from "@/components/drives/FilePreview";

export default function SubjectMaterials({
  folders,
}: {
  folders: SubjectFolderMap;
}) {
  const keys = Object.keys(folders) as DriveKey[];
  const [selected, setSelected] = useState<DriveFile | null>(null);

  if (keys.length === 0) {
    return (
      <p className="text-[13px] text-muted">
        Nenhuma pasta de drive mapeada para esta cadeira.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-2.5">
        {keys.map((k) => {
          const drive = DRIVE_BY_KEY[k];
          const folderId = folders[k]!;
          return (
            <div
              key={k}
              className="overflow-hidden rounded-card border border-edge bg-card"
            >
              <div className="flex items-center gap-2.5 border-b border-edge2 px-4 py-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: drive.color }}
                />
                <span className="text-[13px] font-semibold">{drive.name}</span>
              </div>
              <div className="py-1">
                <DriveTree
                  rootFolderId={folderId}
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
