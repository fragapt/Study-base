"use client";

import { DriveFile, fileIcon, openInDriveUrl, previewUrl } from "@/lib/files";

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

  const src = previewUrl(file);

  return (
    <div className="flex h-full min-h-[300px] flex-col overflow-hidden rounded-card border border-edge bg-card">
      <div className="flex items-center gap-2 border-b border-edge2 px-3 py-2">
        <span className="text-[14px]">{fileIcon(file.mimeType)}</span>
        <span className="flex-1 truncate text-[13px] font-medium">{file.name}</span>
        <a
          href={openInDriveUrl(file)}
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
      {src ? (
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
