"use client";

import { useMemo, useState } from "react";
import { Plus, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useExams } from "@/lib/useExams";
import { useCalendarEvents, type EventInput } from "@/lib/useCalendarEvents";
import { usePersistedState } from "@/lib/usePersistedState";
import { connectGoogleCalendar } from "@/lib/connectGoogle";
import { daysUntil } from "@/lib/dates";
import { normalize, MONTHS_PT } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventCard from "./EventCard";
import EventDialog from "./EventDialog";
import type { CalendarEventDTO } from "@/lib/exam";

type View = "lista" | "mes";

export default function ExamesClient() {
  const { exams, loading: examsLoading, error } = useExams();
  const { events, connected, loading: eventsLoading, create, update, remove } =
    useCalendarEvents();
  const [view, setView] = usePersistedState<View>("bde.exames.view", "lista");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEventDTO | null>(null);

  // Merge the read-only exam feed with the editable Google events.
  const merged = useMemo<CalendarEventDTO[]>(() => {
    const examItems: CalendarEventDTO[] = (exams ?? []).map((e) => ({
      ...e,
      end: undefined,
      tags: [],
      editable: false,
    }));
    return [...examItems, ...events]
      .filter((e) => daysUntil(e.start) >= 0)
      .sort((a, b) => +new Date(a.start) - +new Date(b.start));
  }, [exams, events]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return merged;
    return merged.filter((e) =>
      normalize(
        [e.title, e.description ?? "", e.tags.join(" ")].join(" "),
      ).includes(q),
    );
  }, [merged, query]);

  async function handleSave(input: EventInput) {
    if (editing) {
      await update(editing.id, input);
      toast.success("Evento atualizado.");
    } else {
      await create(input);
      toast.success("Evento criado.");
    }
  }

  async function handleDelete(e: CalendarEventDTO) {
    if (!window.confirm(`Eliminar "${e.title}"?`)) return;
    try {
      await remove(e.id);
      toast.success("Evento eliminado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar");
    }
  }

  const loading = examsLoading || eventsLoading;

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          {(["lista", "mes"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                "rounded-card border px-3 py-1.5 text-[13px] transition-colors",
                view === v
                  ? "border-accent bg-accentSoft text-accent"
                  : "border-edge text-muted hover:bg-card2 hover:text-fg",
              ].join(" ")}
            >
              {v === "lista" ? "Lista" : "Mês"}
            </button>
          ))}
        </div>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrar por palavra-chave ou #etiqueta…"
          className="h-8 max-w-xs flex-1"
        />
        {connected ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Adicionar evento
          </Button>
        ) : null}
      </div>

      {/* Connect banner */}
      {!eventsLoading && !connected ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-card border border-edge bg-card px-4 py-3">
          <CalendarPlus className="h-5 w-5 text-accent" />
          <div className="flex-1 text-[13px] text-muted">
            Liga o teu Google Calendar para criares e editares eventos no site.
          </div>
          <Button size="sm" variant="outline" onClick={() => connectGoogleCalendar("/exames")}>
            Ligar Google Calendar
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-card border border-edge bg-card p-3 text-[12px] text-red">
          {error}
        </p>
      ) : null}

      {loading ? (
        <Spinner label="A carregar o calendário…" />
      ) : filtered.length === 0 ? (
        <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
          {query ? "Nenhum evento corresponde ao filtro." : "Nenhum evento próximo."}
        </p>
      ) : view === "lista" ? (
        <div className="space-y-2.5">
          {filtered.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              onEdit={(ev) => {
                setEditing(ev);
                setDialogOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <MonthView events={filtered} />
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 py-4 text-[13px] text-muted">
      <span
        className="h-[15px] w-[15px] rounded-full border-2 border-edge border-t-accent"
        style={{ animation: "spin .7s linear infinite" }}
      />
      {label}
    </div>
  );
}

function MonthView({ events }: { events: CalendarEventDTO[] }) {
  const [offset, setOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, CalendarEventDTO[]>();
  events.forEach((e) => {
    const d = new Date(e.start);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const list = byDay.get(d.getDate()) ?? [];
      list.push(e);
      byDay.set(d.getDate(), list);
    }
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-card border border-edge bg-card p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="rounded px-2 py-1 text-muted hover:bg-card2 hover:text-fg"
        >
          ←
        </button>
        <div className="text-sm font-semibold capitalize">
          {MONTHS_PT[month]} {year}
        </div>
        <button
          onClick={() => setOffset((o) => o + 1)}
          className="rounded px-2 py-1 text-muted hover:bg-card2 hover:text-fg"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const items = d ? byDay.get(d) : undefined;
          return (
            <div
              key={i}
              className={[
                "min-h-[44px] rounded p-1 text-left",
                d ? "border border-edge2" : "",
                items ? "bg-accentSoft" : "",
              ].join(" ")}
            >
              {d ? (
                <>
                  <div className="text-[11px] text-fg">{d}</div>
                  {items?.map((e) => (
                    <div
                      key={e.id}
                      title={e.title}
                      className="mt-0.5 truncate text-[9px] font-medium text-accent"
                    >
                      {e.title}
                    </div>
                  ))}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
