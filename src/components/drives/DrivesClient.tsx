"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { DRIVES, DriveKey } from "@/lib/constants";
import { DriveFile } from "@/lib/files";
import DriveTree from "./DriveTree";
import FilePreview from "./FilePreview";

export default function DrivesClient() {
  const params = useSearchParams();
  const initial = params.get("drive") as DriveKey | null;
  const [open, setOpen] = useState<DriveKey | null>(
    initial && DRIVES.some((d) => d.key === initial) ? initial : DRIVES[0].key,
  );
  const [selected, setSelected] = useState<DriveFile | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Tree column */}
      <div className="space-y-2.5">
        {DRIVES.map((d) => {
          const isOpen = open === d.key;
          return (
            <div
              key={d.key}
              className="overflow-hidden rounded-card border border-edge bg-card"
            >
              <button
                onClick={() => setOpen(isOpen ? null : d.key)}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-card2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="flex-1 text-sm font-semibold">{d.name}</span>
                <span
                  className={[
                    "text-[10px] text-muted transition-transform",
                    isOpen ? "rotate-90" : "",
                  ].join(" ")}
                >
                  ▶
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-edge2 py-1">
                  <DriveTree
                    rootFolderId={d.folderId}
                    selectedId={selected?.id}
                    onSelect={setSelected}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Preview column — sticky on desktop */}
      <div className="hidden md:block">
        <div className="sticky top-2 h-[calc(100dvh-7rem)]">
          <FilePreview file={selected} />
        </div>
      </div>

      {/* Mobile preview overlay */}
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
