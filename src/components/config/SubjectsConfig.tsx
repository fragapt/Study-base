"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { addSubject, deleteSubject, slugify } from "@/lib/config/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SubjectsConfig() {
  const { config, reload } = useConfig();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📘");
  const [color, setColor] = useState("#2383e2");
  const [keywords, setKeywords] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    if (!name.trim()) {
      setError("Indica um nome.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addSubject({
        name: name.trim(),
        slug: slugify(name),
        icon: icon.trim() || "📘",
        color,
        exam_match: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      });
      await reload();
      setName("");
      setKeywords("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao adicionar");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await deleteSubject(id);
    await reload();
  }

  return (
    <div className="space-y-3">
      {config.subjects.length > 0 ? (
        <ul className="space-y-1.5">
          {config.subjects.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2.5 rounded-card border border-edge bg-app px-3 py-2 text-[13px]"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[13px]"
                style={{ background: `${s.color}24` }}
              >
                {s.icon}
              </span>
              <span className="font-medium">{s.name}</span>
              {s.exam_match.length ? (
                <span className="truncate text-[11px] text-muted">
                  {s.exam_match.join(", ")}
                </span>
              ) : null}
              <button
                onClick={() => remove(s.id)}
                className="ml-auto shrink-0 rounded px-2 py-0.5 text-[11px] text-red hover:bg-red/10"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted">Sem cadeiras.</p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-edge2 pt-3">
        <Input
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-[44px] px-2 text-center text-[15px]"
          aria-label="Ícone"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da cadeira"
          className="w-[160px]"
        />
        <Input
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="palavras-chave de exame (vírgulas)"
          className="min-w-[160px] flex-1"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-edge bg-app"
          aria-label="Cor"
        />
        <Button onClick={add} disabled={busy}>
          + Adicionar
        </Button>
      </div>
      {error ? <p className="text-[12px] text-red">{error}</p> : null}
    </div>
  );
}
