"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DriveFile,
  fileIcon,
  effectiveMime,
  folderTarget,
  openInDriveUrl,
} from "@/lib/files";

async function fetchFolder(
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

function sortFiles(files: DriveFile[]) {
  return [...files].sort((a, b) => {
    const af = Boolean(folderTarget(a));
    const bf = Boolean(folderTarget(b));
    if (af !== bf) return af ? -1 : 1;
    return a.name.localeCompare(b.name, "pt");
  });
}

interface NodeProps {
  file: DriveFile;
  depth: number;
  selectedId?: string;
  onSelect: (file: DriveFile) => void;
}

function TreeNode({ file, depth, selectedId, onSelect }: NodeProps) {
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const target = folderTarget(file);
  const dir = Boolean(target);
  const pad = 8 + depth * 16;

  async function toggle() {
    if (target) {
      const next = !open;
      setOpen(next);
      if (next && kids === null && !loading) {
        setLoading(true);
        setError(null);
        try {
          setKids(await fetchFolder(target.id, target.resourceKey));
        } catch (e) {
          setError(e instanceof Error ? e.message : "Erro");
        } finally {
          setLoading(false);
        }
      }
    } else {
      onSelect(file);
    }
  }

  const active = selectedId === file.id;

  return (
    <div>
      <div
        onClick={toggle}
        style={{ paddingLeft: pad }}
        className={[
          "group flex cursor-pointer items-center gap-1.5 py-[5px] pr-3 text-[13px] transition-colors",
          active ? "bg-accentSoft text-accent" : "hover:bg-card2",
        ].join(" ")}
      >
        <span
          className={[
            "w-2.5 shrink-0 text-[9px] text-muted transition-transform",
            dir ? "" : "opacity-0",
            open ? "rotate-90" : "",
          ].join(" ")}
        >
          ▶
        </span>
        <span className="shrink-0 text-[14px]">{fileIcon(effectiveMime(file))}</span>
        <span className="flex-1 truncate">{file.name}</span>
        <a
          href={openInDriveUrl(file)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded px-1.5 py-0.5 text-[11px] text-accent opacity-0 hover:bg-accentSoft group-hover:opacity-100"
        >
          Abrir ↗
        </a>
      </div>

      {dir && open ? (
        <div>
          {loading ? (
            <div style={{ paddingLeft: pad + 18 }} className="py-1.5 text-[12px] italic text-muted">
              A carregar…
            </div>
          ) : error ? (
            <div style={{ paddingLeft: pad + 18 }} className="py-1.5 text-[12px] text-red">
              {error}
            </div>
          ) : kids && kids.length === 0 ? (
            <div style={{ paddingLeft: pad + 18 }} className="py-1.5 text-[12px] italic text-muted">
              Pasta vazia
            </div>
          ) : (
            kids &&
            sortFiles(kids).map((k) => (
              <TreeNode
                key={k.id}
                file={k}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function DriveTree({
  rootFolderId,
  rootResourceKey,
  selectedId,
  onSelect,
}: {
  rootFolderId: string;
  rootResourceKey?: string;
  selectedId?: string;
  onSelect: (file: DriveFile) => void;
}) {
  const [files, setFiles] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await fetchFolder(rootFolderId, rootResourceKey));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [rootFolderId, rootResourceKey]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !files) {
    return <div className="py-2 text-[12px] italic text-muted">A carregar…</div>;
  }
  if (error) {
    return (
      <div className="py-2 text-[12px] text-red">
        {error}{" "}
        <button onClick={load} className="underline">
          tentar de novo
        </button>
      </div>
    );
  }
  if (files && files.length === 0) {
    return <div className="py-2 text-[12px] italic text-muted">Pasta vazia</div>;
  }

  return (
    <div>
      {files &&
        sortFiles(files).map((f) => (
          <TreeNode
            key={f.id}
            file={f}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
