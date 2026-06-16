"use client";

import { useState, useTransition } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { importDefaultTemplate } from "@/app/(app)/configuracao/actions";

export default function ImportTemplate() {
  const { config, reload } = useConfig();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const hasConfig = config.drives.length > 0 || config.subjects.length > 0;

  function run() {
    setMsg(null);
    startTransition(async () => {
      const res = await importDefaultTemplate();
      setMsg(res.message);
      if (res.ok) await reload();
    });
  }

  if (hasConfig) return null;

  return (
    <div className="mb-4 rounded-card border border-accent/40 bg-accentSoft p-5">
      <h2 className="text-sm font-semibold">Começar rápido</h2>
      <p className="mt-0.5 text-[12px] text-muted">
        Importa a configuração de exemplo (L.EM): drives DNA/NEEM/Wannabe, 4
        cadeiras, pastas e tópicos. Podes editar tudo depois.
      </p>
      <button
        onClick={run}
        disabled={pending}
        className="mt-3 rounded-card bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a6dc0] disabled:opacity-50"
      >
        {pending ? "A importar…" : "Importar configuração de exemplo (L.EM)"}
      </button>
      {msg ? <p className="mt-2 text-[12px] text-muted">{msg}</p> : null}
    </div>
  );
}
