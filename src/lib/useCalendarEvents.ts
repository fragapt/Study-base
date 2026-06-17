"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEventDTO } from "@/lib/exam";

export interface EventInput {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end?: string;
  allDay: boolean;
  tags?: string[];
}

// Loads + mutates the user's editable Google Calendar (via /api/calendar/events).
// `connected` is false until they link Google Calendar.
export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEventDTO[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/calendar/events");
      const data = await res.json();
      setConnected(Boolean(data.connected));
      setEvents((data.events as CalendarEventDTO[]) ?? []);
    } catch {
      // ignore — leave as disconnected/empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function send(method: "POST" | "PATCH", body: unknown) {
    const res = await fetch("/api/calendar/events", {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro");
    await load();
  }

  const create = useCallback((input: EventInput) => send("POST", input), []);
  const update = useCallback(
    (id: string, input: EventInput) => send("PATCH", { id, ...input }),
    [],
  );
  const remove = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/calendar/events?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setEvents((prev) => prev.filter((e) => e.id !== id));
    },
    [],
  );

  return { events, connected, loading, reload: load, create, update, remove };
}
