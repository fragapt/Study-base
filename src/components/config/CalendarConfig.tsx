"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { saveCalendarId } from "@/lib/config/mutations";

export default function CalendarConfig() {
  const { config, reload } = useConfig();
  const [value, setValue] = useState(config.examCalendarId ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await saveCalendarId(value.trim() || null);
      await reload();
      setMsg("Guardado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="…@group.calendar.google.com"
        className="min-w-[240px] flex-1 rounded-card border border-edge bg-app px-3 py-2 text-[13px] outline-none focus:border-accent"
      />
      <button
        onClick={save}
        disabled={saving}
        className="rounded-card bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#1a6dc0] disabled:opacity-50"
      >
        Guardar
      </button>
      {msg ? <span className="text-[12px] text-muted">{msg}</span> : null}
    </div>
  );
}
