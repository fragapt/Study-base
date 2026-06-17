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
import {
  fetchChildren,
  nodeChildrenRoot,
  folderLocator,
  rootFromDrive,
} from "@/lib/sourceTree";
import FolderPicker from "./FolderPicker";
import { Button } from "@/components/ui/button";

// Scans each source (Drive folder / GitHub repo) root + one level deep,
// returning candidate folders for auto-matching.
async function scanSources(config: UserConfig): Promise<ScannedFolder[]> {
  const out: ScannedFolder[] = [];
  for (const d of config.drives) {
    let top;
    try {
      top = await fetchChildren(rootFromDrive(d));
    } catch {
      continue;
    }
    const topFolders = top.filter((f) => nodeChildrenRoot(f));
    for (const f of topFolders) {
      const loc = folderLocator(f)!;
      out.push({ driveId: d.id, ...loc, name: f.name });
      try {
        const sub = await fetchChildren(nodeChildrenRoot(f)!);
        for (const g of sub.filter((x) => nodeChildrenRoot(x))) {
          out.push({ driveId: d.id, ...folderLocator(g)!, name: g.name });
        }
      } catch {
        // ignore a folder we can't descend
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
      setStatus("Precisas de fontes e cadeiras primeiro.");
      return;
    }
    setScanning(true);
    setStatus("A analisar as fontes…");
    try {
      const scanned = await scanSources(config);
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
          provider: s.provider,
          folder_id: s.folderId,
          resource_key: s.resourceKey ?? null,
          repo_full: s.repoFull ?? null,
          git_ref: s.gitRef ?? null,
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
        <Button variant="outline" size="sm" onClick={autoDetect} disabled={scanning}>
          {scanning ? "A analisar…" : "Detetar automaticamente"}
        </Button>
        {status ? <span className="text-[12px] text-muted">{status}</span> : null}
      </div>

      {config.subjects.map((s) => {
        const attached = foldersForSubject(config, s.id);
        const openPicker = pickerFor === s.id;
        const drive = config.drives.find((d) => d.id === pickDrive);
        return (
          <div key={s.id} className="rounded-card border border-edge bg-app p-3">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <span>{s.icon}</span> {s.name}
            </div>

            {attached.length > 0 ? (
              <ul className="space-y-1">
                {attached.map((f) => {
                  const d = driveById(config, f.drive_id);
                  return (
                    <li key={f.id} className="flex items-center gap-2 text-[12.5px]">
                      <span>{f.provider === "github" ? "🐙" : "📁"}</span>
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
                    className="rounded-card border border-edge bg-app px-3 py-2 text-[13px] text-fg outline-none focus:border-accent"
                  >
                    <option value="">— Escolhe uma fonte —</option>
                    {config.drives.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {drive ? (
                    <FolderPicker
                      rootName={drive.name}
                      root={rootFromDrive(drive)}
                      onAttach={async (folder) => {
                        await addSubjectFolder({
                          subject_id: s.id,
                          drive_id: drive.id,
                          provider: folder.provider,
                          folder_id: folder.folderId,
                          resource_key: folder.resourceKey ?? null,
                          repo_full: folder.repoFull ?? null,
                          git_ref: folder.gitRef ?? null,
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
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPickerFor(s.id);
                    setPickDrive("");
                  }}
                >
                  + Adicionar pasta
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
