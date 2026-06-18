"use client";

import { useState } from "react";
import {
  DriveFile,
  fileIcon,
  effectiveMime,
  targetFromDriveFile,
  targetKey,
  type MaterialTarget,
} from "@/lib/files";
import {
  fetchChildren,
  nodeChildrenRoot,
  rootFromSubjectFolder,
  type SourceRoot,
} from "@/lib/sourceTree";
import type { SubjectFolderRow } from "@/lib/supabase/types";

function sortFiles(files: DriveFile[]) {
  return [...files].sort((a, b) => {
    const af = Boolean(nodeChildrenRoot(a));
    const bf = Boolean(nodeChildrenRoot(b));
    if (af !== bf) return af ? -1 : 1;
    return a.name.localeCompare(b.name, "pt");
  });
}

interface Selection {
  selected: Map<string, MaterialTarget>;
  onToggle: (file: DriveFile) => void;
}

function FileNode({ file, depth, selected, onToggle }: { file: DriveFile; depth: number } & Selection) {
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const childRoot = nodeChildrenRoot(file);
  const dir = Boolean(childRoot);
  const target = dir ? null : targetFromDriveFile(file);
  const checked = target ? selected.has(targetKey(target)) : false;
  const pad = 6 + depth * 16;

  async function expand() {
    if (!childRoot) return;
    const next = !open;
    setOpen(next);
    if (next && kids === null && !loading) {
      setLoading(true);
      try {
        setKids(await fetchChildren(childRoot));
      } catch {
        setKids([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <div
        style={{ paddingLeft: pad }}
        className="flex items-center gap-1.5 py-[3px] pr-2 text-[13px]"
      >
        {dir ? (
          <button
            onClick={expand}
            className={[
              "w-3 shrink-0 text-[9px] text-muted transition-transform",
              open ? "rotate-90" : "",
            ].join(" ")}
          >
            ▶
          </button>
        ) : (
          <input
            type="checkbox"
            checked={checked}
            disabled={!target}
            onChange={() => target && onToggle(file)}
            className="h-3.5 w-3.5 shrink-0 accent-[var(--accent)] disabled:opacity-40"
          />
        )}
        <span className="shrink-0 text-[13px]">{fileIcon(effectiveMime(file))}</span>
        <span
          onClick={dir ? expand : () => target && onToggle(file)}
          className="flex-1 cursor-pointer truncate"
        >
          {file.name}
        </span>
      </div>
      {dir && open ? (
        loading ? (
          <div style={{ paddingLeft: pad + 18 }} className="py-1 text-[12px] italic text-muted">
            A carregar…
          </div>
        ) : kids && kids.length === 0 ? (
          <div style={{ paddingLeft: pad + 18 }} className="py-1 text-[12px] italic text-muted">
            Vazia
          </div>
        ) : (
          kids && sortFiles(kids).map((k) => (
            <FileNode key={k.id} file={k} depth={depth + 1} selected={selected} onToggle={onToggle} />
          ))
        )
      ) : null}
    </div>
  );
}

function RootGroup({ folder, selected, onToggle }: { folder: SubjectFolderRow } & Selection) {
  const [open, setOpen] = useState(false);
  const [kids, setKids] = useState<DriveFile[] | null>(null);
  const [loading, setLoading] = useState(false);
  const root: SourceRoot = rootFromSubjectFolder(folder);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && kids === null && !loading) {
      setLoading(true);
      try {
        setKids(await fetchChildren(root));
      } catch {
        setKids([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center gap-1.5 py-1 text-left text-[13px] font-medium"
      >
        <span className={["text-[9px] text-muted transition-transform", open ? "rotate-90" : ""].join(" ")}>
          ▶
        </span>
        <span>📁</span>
        <span className="truncate">{folder.name ?? "Pasta"}</span>
      </button>
      {open ? (
        loading ? (
          <div className="pl-5 py-1 text-[12px] italic text-muted">A carregar…</div>
        ) : kids && kids.length === 0 ? (
          <div className="pl-5 py-1 text-[12px] italic text-muted">Vazia</div>
        ) : (
          kids && sortFiles(kids).map((k) => (
            <FileNode key={k.id} file={k} depth={1} selected={selected} onToggle={onToggle} />
          ))
        )
      ) : null}
    </div>
  );
}

// Checkbox tree over a subject's linked folders. Selecting a file adds its
// MaterialTarget to the selection map (keyed by DriveFile id).
export default function SourceFileTree({
  folders,
  selected,
  onToggle,
}: { folders: SubjectFolderRow[] } & Selection) {
  if (folders.length === 0) {
    return (
      <p className="py-2 text-[12px] text-muted">
        Esta cadeira não tem pastas ligadas. Liga pastas em Configuração.
      </p>
    );
  }
  return (
    <div className="max-h-[240px] overflow-y-auto rounded-card border border-edge2 bg-app p-1.5">
      {folders.map((f) => (
        <RootGroup key={f.id} folder={f} selected={selected} onToggle={onToggle} />
      ))}
    </div>
  );
}
