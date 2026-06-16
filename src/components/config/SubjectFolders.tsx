"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import {
  driveById,
  foldersForSubject,
  type UserConfig,
} from "@/lib/config/types";
import { addSubjectFolder, deleteSubjectFolder } from "@/lib/config/mutations";
import { suggestFolders, type ScannedFolder } from "@/lib/match";
import { DriveFile, folderTarget } from "@/lib/files";
import FolderPicker from "./FolderPicker";

async function listFolder(
  folderId: string,
  resourceKey?: string,
): Promise<DriveFile[]> {
  const qs = new URLSearchParams({ folderId });
  if (resourceKey) qs.set("resourceKey", resourceKey);
  const res = await fetch(`/api/drive?${qs}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.files as DriveFile[]) ?? [];
}

// Scans each drive's root + one level deep, returning candidate folders.
async function scanDrives(config: UserConfig): Promise<ScannedFolder[]> {
  const out: ScannedFolder[] = [];
  for (const d of config.drives) {
    const top = await listFolder(d.folder_id, d.resource_key ?? undefined);
    const topFolders = top.filter((f) => folderTarget(f));
    for (const f of topFolders) {
      const tgt = folderTarget(f)!;
      out.push({
        driveId: d.id,
        folderId: tgt.id,
        resourceKey: tgt.resourceKey,
        name: f.name,
      });
      const sub = await listFolder(tgt.id, tgt.resourceKey);
      for (const g of sub.filter((x) => folderTarget(x))) {
        const gt = folderTarget(g)!;
        out.push({
          driveId: d.id,
          folderId: gt.id,
          resourceKey: gt.resourceKey,
          name: g.name,
        });
      }
    }
  }
  return out;
}

export default function SubjectFolders() {
  const { config, reload } = useConfig();
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<string | null>(null); // subjectId
  const [pickDrive, setPickDrive] = useState<string>("");

  async function autoDetect() {
    if (config.drives.length === 0 || config.subjects.length === 0) {
      setStatus("Precisas de drives e cadeiras primeiro.");
      return;
    }
    setScanning(true);
    setStatus("A analisar as drives…");
    try {
      const scanned = await scanDrives(config);
      const suggestions = suggestFolders(scanned, config.subjects);
      let added = 0;
      for (const s of suggestions) {
        const exists = config.subjectFolders.some(
          (f) => f.subject_id === s.subjectId && f.folder_id === s.folderId,
        );
        if (exists) continue;
        await addSubjectFolder({
          subject_id: s.subjectId,
          drive_id: s.driveId,
          folder_id: s.folderId,
          resource_key: s.resourceKey ?? null,
          name: s.name,
          source: "auto",
        });
        added++;
      }
      await reload();
      setStatus(
        added > 0
          ? `Adicionadas ${added} pasta(s) automaticamente.`
          : "Nada novo encontrado.",
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Erro na análise");
    } finally {
      setScanning(false);
    }
  }

  async function remove(id: string) {
    await deleteSubjectFolder(id);
    await reload();
  }

  if (config.subjects.length === 0) {
    return <p className="text-[12px] text-muted">Cria cadeiras primeiro.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={autoDetect}
          disabled={scanning}
          className="rounded-card border border-accent px-3 py-1.5 text-[13px] text-accent transition-colors hover:bg-accentSoft disabled:opacity-50"
        >
          {scanning ? "A analisar…" : "Detetar automaticamente"}
        </button>
        {status ? <span className="text-[12px] text-muted">{status}</span> : null}
      </div>

      {config.subjects.map((s) => {
        const attached = foldersForSubject(config, s.id);
        const openPicker = pickerFor === s.id;
        const drive = config.drives.find((d) => d.id === pickDrive);
        return (
          <div
            key={s.id}
            className="rounded-card border border-edge bg-app p-3"
          >
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <span>{s.icon}</span> {s.name}
            </div>

            {attached.length > 0 ? (
              <ul className="space-y-1">
                {attached.map((f) => {
                  const d = driveById(config, f.drive_id);
                  return (
                    <li
                      key={f.id}
                      className="flex items-center gap-2 text-[12.5px]"
                    >
                      <span>📁</span>
                      <span className="truncate">{f.name ?? f.folder_id}</span>
                      {d ? (
                        <span className="text-[11px] text-muted">· {d.name}</span>
                      ) : null}
                      {f.source === "auto" ? (
                        <span className="rounded bg-accentSoft px-1 text-[10px] text-accent">
                          auto
                        </span>
                      ) : null}
                      <button
                        onClick={() => remove(f.id)}
                        className="ml-auto rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
                      >
                        Remover
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[12px] text-muted">Sem pastas ligadas.</p>
            )}

            <div className="mt-2 border-t border-edge2 pt-2">
              {openPicker ? (
                <div className="space-y-2">
                  <select
                    value={pickDrive}
                    onChange={(e) => setPickDrive(e.target.value)}
                    className="rounded-card border border-edge bg-app px-3 py-1.5 text-[13px] outline-none focus:border-accent"
                  >
                    <option value="">— Escolhe uma drive —</option>
                    {config.drives.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {drive ? (
                    <FolderPicker
                      rootName={drive.name}
                      rootFolderId={drive.folder_id}
                      rootResourceKey={drive.resource_key ?? undefined}
                      onAttach={async (folder) => {
                        await addSubjectFolder({
                          subject_id: s.id,
                          drive_id: drive.id,
                          folder_id: folder.folderId,
                          resource_key: folder.resourceKey ?? null,
                          name: folder.name,
                          source: "manual",
                        });
                        await reload();
                        setPickerFor(null);
                        setPickDrive("");
                      }}
                      onClose={() => {
                        setPickerFor(null);
                        setPickDrive("");
                      }}
                    />
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setPickerFor(s.id);
                    setPickDrive("");
                  }}
                  className="rounded-card border border-edge px-3 py-1.5 text-[12px] text-muted hover:bg-card2 hover:text-fg"
                >
                  + Adicionar pasta
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
