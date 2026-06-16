"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useConfig } from "@/lib/config/ConfigProvider";
import { DriveFile } from "@/lib/files";
import DriveTree from "./DriveTree";
import FilePreview from "./FilePreview";

export default function DrivesClient() {
  const { config } = useConfig();
  const drives = config.drives;
  const params = useSearchParams();
  const initial = params.get("drive");
  const [open, setOpen] = useState<string | null>(
    initial && drives.some((d) => d.id === initial)
      ? initial
      : (drives[0]?.id ?? null),
  );
  const [selected, setSelected] = useState<DriveFile | null>(null);

  if (drives.length === 0) {
    return (
      <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Sem drives configuradas. Adiciona-as em{" "}
        <Link href="/configuracao" className="text-accent hover:underline">
          Configuração
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Tree column */}
      <div className="space-y-2.5">
        {drives.map((d) => {
          const isOpen = open === d.id;
          return (
            <div
              key={d.id}
              className="overflow-hidden rounded-card border border-edge bg-card"
            >
              <button
                onClick={() => setOpen(isOpen ? null : d.id)}
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
                    rootFolderId={d.folder_id}
                    rootResourceKey={d.resource_key ?? undefined}
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
