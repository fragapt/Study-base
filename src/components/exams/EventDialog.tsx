"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CalendarEventDTO } from "@/lib/exam";
import type { EventInput } from "@/lib/useCalendarEvents";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(+d)) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function EventDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: CalendarEventDTO | null;
  onSave: (input: EventInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
    setTitle(initial?.title ?? "");
    const ad = initial ? initial.allDay : true;
    setAllDay(ad);
    if (initial) {
      setStart(ad ? initial.start.slice(0, 10) : toLocalInput(initial.start));
      setEnd(initial.end ? (ad ? initial.end.slice(0, 10) : toLocalInput(initial.end)) : "");
    } else {
      setStart("");
      setEnd("");
    }
    setLocation(initial?.location ?? "");
    setDescription(initial?.description ?? "");
    setTags(initial?.tags.join(", ") ?? "");
  }, [open, initial]);

  function toIso(value: string): string {
    if (!value) return "";
    return allDay ? value : new Date(value).toISOString();
  }

  async function save() {
    if (!title.trim() || !start) {
      setError("Indica um título e uma data.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
        summary: title.trim(),
        start: toIso(start),
        end: end ? toIso(end) : undefined,
        allDay,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao guardar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Editar evento" : "Novo evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do evento"
          />
          <label className="flex items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            Dia inteiro
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] text-muted">Início</label>
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-muted">Fim (opcional)</label>
              <Input
                type={allDay ? "date" : "datetime-local"}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Local (opcional)"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Etiquetas, separadas por vírgulas (ex.: projeto, entrega)"
          />
          {error ? <p className="text-[12px] text-red">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={busy}>
            {busy ? "A guardar…" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
