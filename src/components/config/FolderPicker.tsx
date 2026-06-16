"use client";

import { useCallback, useEffect, useState } from "react";
import { DriveFile, folderTarget } from "@/lib/files";

interface Crumb {
  id: string;
  resourceKey?: string;
  name: string;
}

async function listFolder(
  folderId: string,
  resourceKey?: string,
): Promise<DriveFile[]> {
  const qs = new URLSearchParams({ folderId });
  if (resourceKey) qs.set("resourceKey", resourceKey);
  const res = await fetch(`/api/drive?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao carregar a pasta");
  return (data.files as DriveFile[]) ?? [];
}

// Browses one drive's folders, letting the user descend and attach a folder.
export default function FolderPicker({
  rootName,
  rootFolderId,
  rootResourceKey,
  onAttach,
  onClose,
}: {
  rootName: string;
  rootFolderId: string;
  rootResourceKey?: string;
  onAttach: (folder: {
    folderId: string;
    resourceKey?: string;
    name: string;
  }) => void;
  onClose: () => void;
}) {
  const [stack, setStack] = useState<Crumb[]>([
    { id: rootFolderId, resourceKey: rootResourceKey, name: rootName },
  ]);
  const [items, setItems] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = stack[stack.length - 1];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await listFolder(current.id, current.resourceKey);
      setItems(files.filter((f) => folderTarget(f)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [current.id, current.resourceKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-card border border-edge bg-app p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[12px] text-muted">
        {stack.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 ? <span>›</span> : null}
            <button
              onClick={() => setStack((s) => s.slice(0, i + 1))}
              className="max-w-[140px] truncate hover:text-fg"
            >
              {c.name}
            </button>
          </span>
        ))}
        <button
          onClick={onClose}
          className="ml-auto rounded px-1.5 text-[14px] leading-none text-dim hover:text-fg"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-edge2 pb-2">
        <span className="text-[12px] text-muted">
          Pasta atual: <span className="text-fg">{current.name}</span>
        </span>
        <button
          onClick={() =>
            onAttach({
              folderId: current.id,
              resourceKey: current.resourceKey,
              name: current.name,
            })
          }
          className="rounded-card bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1a6dc0]"
        >
          Anexar esta pasta
        </button>
      </div>

      <div className="mt-1 max-h-[240px] overflow-y-auto">
        {loading ? (
          <p className="py-2 text-[12px] italic text-muted">A carregar…</p>
        ) : error ? (
          <p className="py-2 text-[12px] text-red">{error}</p>
        ) : items && items.length === 0 ? (
          <p className="py-2 text-[12px] italic text-muted">Sem subpastas.</p>
        ) : (
          items?.map((f) => {
            const tgt = folderTarget(f)!;
            return (
              <div
                key={f.id}
                className="flex items-center gap-2 py-1 text-[13px]"
              >
                <button
                  onClick={() =>
                    setStack((s) => [
                      ...s,
                      { id: tgt.id, resourceKey: tgt.resourceKey, name: f.name },
                    ])
                  }
                  className="flex flex-1 items-center gap-1.5 truncate text-left hover:text-accent"
                >
                  <span>📁</span>
                  <span className="truncate">{f.name}</span>
                </button>
                <button
                  onClick={() =>
                    onAttach({
                      folderId: tgt.id,
                      resourceKey: tgt.resourceKey,
                      name: f.name,
                    })
                  }
                  className="shrink-0 rounded px-2 py-0.5 text-[11px] text-accent hover:bg-accentSoft"
                >
                  Anexar
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
