"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { MindmapNode } from "@/lib/studyContent";

function Node({ node, depth }: { node: MindmapNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = Boolean(node.children?.length);

  return (
    <div>
      <div
        onClick={() => hasChildren && setOpen((o) => !o)}
        style={{ paddingLeft: depth * 14 }}
        className={[
          "flex items-center gap-1.5 rounded py-1 pr-2 text-[13px]",
          hasChildren ? "cursor-pointer hover:bg-card2" : "",
          depth === 0 ? "font-semibold text-accent" : "text-fg",
        ].join(" ")}
      >
        <ChevronRight
          className={[
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
            hasChildren ? "" : "opacity-0",
            open ? "rotate-90" : "",
          ].join(" ")}
        />
        <span className="leading-snug">{node.title}</span>
      </div>
      {hasChildren && open ? (
        <div className="border-l border-edge2" style={{ marginLeft: depth * 14 + 6 }}>
          {node.children!.map((c, i) => (
            <Node key={i} node={c} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MindmapView({ root }: { root: MindmapNode }) {
  return (
    <div className="rounded-card border border-edge bg-card2/30 p-2">
      <Node node={root} depth={0} />
    </div>
  );
}
