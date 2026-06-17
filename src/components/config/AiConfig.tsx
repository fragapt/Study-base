"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { saveAiCredentials } from "@/lib/config/mutations";

export default function AiConfig() {
  const { config, reload } = useConfig();
  const [key, setKey] = useState("");
  const [channelId, setChannelId] = useState(config.aiChannelId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const ready = config.aiKeyPresent && Boolean(config.aiChannelId);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      // Empty key keeps the existing one only if a channel id is already set;
      // otherwise require a key.
      await saveAiCredentials(key.trim() || null, channelId.trim() || null);
      await reload();
      setKey("");
      setMsg("Guardado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setBusy(false);
    }
  }

  async function clearKey() {
    setBusy(true);
    setMsg(null);
    try {
      await saveAiCredentials(null, channelId.trim() || null);
      await reload();
      setKey("");
      setMsg("Chave removida.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[12px] text-muted">
        Estado:{" "}
        {ready ? (
          <span className="text-green">IAedu pronto ✓</span>
        ) : config.aiKeyPresent ? (
          <span>chave definida — falta o channel ID</span>
        ) : (
          <span>sem credenciais</span>
        )}
        . A chave é guardada de forma privada e nunca é enviada para o navegador.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={
            config.aiKeyPresent ? "Nova API key (vazio = manter)" : "API key (sk-usr-…)"
          }
          className="min-w-[220px] flex-1 rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <input
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="Channel ID"
          className="w-[200px] rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <button
          onClick={save}
          disabled={busy}
          className="rounded-card bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a6dc0] disabled:opacity-50"
        >
          Guardar
        </button>
        {config.aiKeyPresent ? (
          <button
            onClick={clearKey}
            disabled={busy}
            className="rounded-card border border-edge px-3 py-2 text-[13px] text-muted hover:bg-card2 hover:text-fg disabled:opacity-50"
          >
            Remover chave
          </button>
        ) : null}
        {msg ? <span className="text-[12px] text-muted">{msg}</span> : null}
      </div>
    </div>
  );
}
