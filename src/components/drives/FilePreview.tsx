"use client";

import { useEffect, useState } from "react";
import {
  DriveFile,
  fileIcon,
  previewUrl,
  isTextPreviewable,
} from "@/lib/files";
import { externalUrl } from "@/lib/sourceTree";

function GithubPreview({ file }: { file: DriveFile }) {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isImage = file.mimeType.startsWith("image/");
  const canText = isTextPreviewable(file.mimeType);

  useEffect(() => {
    if (!canText || !file.downloadUrl) return;
    let alive = true;
    setLoading(true);
    setError(null);
    setText(null);
    fetch(`/api/github/raw?url=${encodeURIComponent(file.downloadUrl)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Erro");
        if (alive) setText(data.text as string);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [file.downloadUrl, canText]);

  if (isImage && file.downloadUrl) {
    return (
      <div className="flex flex-1 items-center justify-center overflow-auto bg-white p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.downloadUrl} alt={file.name} className="max-h-full max-w-full" />
      </div>
    );
  }
  if (!canText) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-muted">
        Sem pré-visualização. Usa “Abrir ↗” para ver no GitHub.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-[13px] text-muted">
        A carregar…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-red">
        {error}
      </div>
    );
  }
  return (
    <pre className="flex-1 overflow-auto bg-card2 p-3 text-[12px] leading-relaxed text-fg">
      {text}
    </pre>
  );
}

export default function FilePreview({
  file,
  onClose,
}: {
  file: DriveFile | null;
  onClose?: () => void;
}) {
  if (!file) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-card border border-edge bg-card text-center text-muted">
        <div className="mb-2 text-3xl">📄</div>
        <p className="text-[13px]">Seleciona um ficheiro para pré-visualizar.</p>
      </div>
    );
  }

  const isGithub = file.provider === "github";
  const src = isGithub ? null : previewUrl(file);

  return (
    <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-card border border-edge bg-card">
      <div className="flex items-center gap-2 border-b border-edge2 px-3 py-2">
        <span className="text-[14px]">{fileIcon(file.mimeType)}</span>
        <span className="flex-1 truncate text-[13px] font-medium">{file.name}</span>
        <a
          href={externalUrl(file)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded px-2 py-1 text-[11px] text-accent hover:bg-accentSoft"
        >
          Abrir ↗
        </a>
        {onClose ? (
          <button
            onClick={onClose}
            className="shrink-0 px-1 text-lg leading-none text-dim hover:text-fg md:hidden"
            aria-label="Fechar"
          >
            ×
          </button>
        ) : null}
      </div>
      {isGithub ? (
        <GithubPreview file={file} />
      ) : src ? (
        <iframe
          key={file.id}
          src={src}
          className="h-full w-full flex-1 bg-white"
          allow="autoplay"
          title={file.name}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-[13px] text-muted">
          Sem pré-visualização disponível.
        </div>
      )}
    </div>
  );
}
