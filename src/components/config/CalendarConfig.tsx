"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { saveCalendarId } from "@/lib/config/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="…@group.calendar.google.com"
        className="min-w-[240px] flex-1"
      />
      <Button onClick={save} disabled={saving}>
        Guardar
      </Button>
      {msg ? <span className="text-[12px] text-muted">{msg}</span> : null}
    </div>
  );
}
