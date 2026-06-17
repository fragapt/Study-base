"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { driveById, foldersForSubject } from "@/lib/config/types";
import { DriveFile, targetFromDriveFile } from "@/lib/files";
import { rootFromSubjectFolder } from "@/lib/sourceTree";
import DriveTree from "@/components/drives/DriveTree";
import FilePreview from "@/components/drives/FilePreview";
import { Button } from "@/components/ui/button";
import GenerateDialog from "@/components/study/GenerateDialog";

export default function SubjectMaterials({ subjectId }: { subjectId: string }) {
  const { config } = useConfig();
  const folders = foldersForSubject(config, subjectId);
  const [selected, setSelected] = useState<DriveFile | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const aiReady = config.aiKeyPresent && Boolean(config.aiChannelId);
  const target = selected ? targetFromDriveFile(selected) : null;

  function GenBar() {
    if (!target || !aiReady) return null;
    return (
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={() => {
          setSaved(false);
          setGenOpen(true);
        }}
      >
        <Sparkles className="h-4 w-4" /> Gerar conteúdo deste documento
      </Button>
    );
  }

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
        <div className="sticky top-2 space-y-2">
          <GenBar />
          {saved ? (
            <p className="rounded-card border border-green/40 bg-greenSoft px-3 py-1.5 text-[12px] text-green">
              ✓ Guardado na{" "}
              <Link href="/biblioteca" className="underline">
                Biblioteca
              </Link>
              .
            </p>
          ) : null}
          <div className="h-[calc(100dvh-12rem)]">
            <FilePreview file={selected} />
          </div>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex flex-col gap-2 bg-app p-3 md:hidden">
          <GenBar />
          <div className="h-full">
            <FilePreview file={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      ) : null}

      {target ? (
        <GenerateDialog
          open={genOpen}
          onOpenChange={setGenOpen}
          subjectId={subjectId}
          documents={[target]}
          sourceLabels={[target.name]}
          onGenerated={() => setSaved(true)}
        />
      ) : null}
    </div>
  );
}
