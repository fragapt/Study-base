"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { addDrive, deleteDrive } from "@/lib/config/mutations";
import { parseDriveFolderLink } from "@/lib/files";
import { parseGithubRepoLink, looksLikeGithub } from "@/lib/githubLink";

export default function DrivesConfig() {
  const { config, reload } = useConfig();
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [color, setColor] = useState("#2383e2");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setError(null);

    // GitHub repository?
    if (looksLikeGithub(link)) {
      const gh = parseGithubRepoLink(link);
      if (!gh) {
        setError("Link de GitHub inválido.");
        return;
      }
      setBusy(true);
      try {
        await addDrive({
          name: name.trim() || gh.repoFull.split("/")[1],
          provider: "github",
          folder_id: gh.path ?? "",
          repo_full: gh.repoFull,
          git_ref: gh.ref ?? null,
          color,
        });
        await reload();
        setName("");
        setLink("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao adicionar");
      } finally {
        setBusy(false);
      }
      return;
    }

    // Google Drive folder
    const parsed = parseDriveFolderLink(link);
    if (!name.trim() || !parsed) {
      setError("Indica um nome e um link/ID de pasta (Drive) ou um link de GitHub.");
      return;
    }
    setBusy(true);
    try {
      await addDrive({
        name: name.trim(),
        provider: "drive",
        folder_id: parsed.folderId,
        resource_key: parsed.resourceKey ?? null,
        color,
      });
      await reload();
      setName("");
      setLink("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await deleteDrive(id);
    await reload();
  }

  return (
    <div className="space-y-3">
      {config.drives.length > 0 ? (
        <ul className="space-y-1.5">
          {config.drives.map((d) => (
            <li
              key={d.id}
              className="flex items-center gap-2.5 rounded-card border border-edge bg-app px-3 py-2 text-[13px]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: d.color }}
              />
              <span className="shrink-0">{d.provider === "github" ? "🐙" : "📁"}</span>
              <span className="font-medium">{d.name}</span>
              <span className="truncate text-[11px] text-muted">
                {d.provider === "github"
                  ? `${d.repo_full}${d.git_ref ? `@${d.git_ref}` : ""}`
                  : `${d.folder_id}${d.resource_key ? " · rk" : ""}`}
              </span>
              <button
                onClick={() => remove(d.id)}
                className="ml-auto shrink-0 rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted">Sem drives.</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-edge2 pt-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (ex.: NEEM)"
          className="w-[140px] rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Link de pasta do Drive ou repositório do GitHub"
          className="min-w-[200px] flex-1 rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-edge bg-app"
          aria-label="Cor"
        />
        <button
          onClick={add}
          disabled={busy}
          className="rounded-card bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a6dc0] disabled:opacity-50"
        >
          + Adicionar
        </button>
      </div>
      {error ? <p className="text-[12px] text-red">{error}</p> : null}
    </div>
  );
}
