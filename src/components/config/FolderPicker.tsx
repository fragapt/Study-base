"use client";

import { useCallback, useEffect, useState } from "react";
import { DriveFile } from "@/lib/files";
import {
  SourceRoot,
  FolderLocator,
  fetchChildren,
  nodeChildrenRoot,
  folderLocator,
  rootLocator,
} from "@/lib/sourceTree";
import { Button } from "@/components/ui/button";

export interface AttachFolder extends FolderLocator {
  name: string;
}

interface Crumb {
  root: SourceRoot;
  name: string;
}

// Browses a source (Drive folder or GitHub repo), letting the user descend and
// attach a folder.
export default function FolderPicker({
  rootName,
  root,
  onAttach,
  onClose,
}: {
  rootName: string;
  root: SourceRoot;
  onAttach: (folder: AttachFolder) => void;
  onClose: () => void;
}) {
  const [stack, setStack] = useState<Crumb[]>([{ root, name: rootName }]);
  const [items, setItems] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = stack[stack.length - 1];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const files = await fetchChildren(current.root);
      setItems(files.filter((f) => nodeChildrenRoot(f)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.root.provider, current.root.folderId, current.root.resourceKey, current.root.repoFull, current.root.gitRef, current.root.path]);

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
        <Button
          size="sm"
          className="h-7 px-2.5 text-[11px]"
          onClick={() =>
            onAttach({ ...rootLocator(current.root), name: current.name })
          }
        >
          Anexar esta pasta
        </Button>
      </div>

      <div className="mt-1 max-h-[240px] overflow-y-auto">
        {loading ? (
          <p className="py-2 text-[12px] italic text-muted">A carregar…</p>
        ) : error ? (
          <p className="py-2 text-[12px] text-red">{error}</p>
        ) : items && items.length === 0 ? (
          <p className="py-2 text-[12px] italic text-muted">Sem subpastas.</p>
        ) : (
          items?.map((f) => (
            <div key={f.id} className="flex items-center gap-2 py-1 text-[13px]">
              <button
                onClick={() =>
                  setStack((s) => [
                    ...s,
                    { root: nodeChildrenRoot(f)!, name: f.name },
                  ])
                }
                className="flex flex-1 items-center gap-1.5 truncate text-left hover:text-accent"
              >
                <span>📁</span>
                <span className="truncate">{f.name}</span>
              </button>
              <button
                onClick={() => onAttach({ ...folderLocator(f)!, name: f.name })}
                className="shrink-0 rounded px-2 py-0.5 text-[11px] text-accent hover:bg-accentSoft"
              >
                Anexar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
