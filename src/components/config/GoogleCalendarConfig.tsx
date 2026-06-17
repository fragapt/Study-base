"use client";

import { useState } from "react";
import { useConfig } from "@/lib/config/ConfigProvider";
import { useCalendarEvents } from "@/lib/useCalendarEvents";
import { connectGoogleCalendar } from "@/lib/connectGoogle";
import { saveWriteCalendarId } from "@/lib/config/mutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function GoogleCalendarConfig() {
  const { config, reload } = useConfig();
  const { connected, loading } = useCalendarEvents();
  const [value, setValue] = useState(config.writeCalendarId ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await saveWriteCalendarId(value.trim() || null);
      await reload();
      setMsg("Guardado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {loading ? (
          <span className="text-[12px] text-muted">A verificar ligação…</span>
        ) : connected ? (
          <Badge variant="green">✓ Ligado</Badge>
        ) : (
          <Badge variant="muted">Não ligado</Badge>
        )}
        <Button size="sm" variant="outline" onClick={() => connectGoogleCalendar("/configuracao")}>
          {connected ? "Religar / reautorizar" : "Ligar Google Calendar"}
        </Button>
      </div>

      <div>
        <label className="mb-1 block text-[12px] text-muted">
          Calendário para escrita (deixa vazio para o calendário principal)
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="primary  ou  …@group.calendar.google.com"
            className="min-w-[240px] flex-1"
          />
          <Button size="sm" onClick={save} disabled={saving}>
            Guardar
          </Button>
          {msg ? <span className="text-[12px] text-muted">{msg}</span> : null}
        </div>
      </div>
    </div>
  );
}
