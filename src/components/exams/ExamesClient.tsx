"use client";

import { useMemo, useState } from "react";
import { useExams } from "@/lib/useExams";
import { daysUntil } from "@/lib/dates";
import { MONTHS_PT } from "@/lib/constants";
import ExamCard from "./ExamCard";
import type { ExamDTO } from "@/lib/exam";

type View = "lista" | "mes";

export default function ExamesClient() {
  const { exams, loading, error } = useExams();
  const [view, setView] = useState<View>("lista");

  const upcoming = useMemo(
    () =>
      (exams ?? [])
        .filter((e) => daysUntil(e.start) >= 0)
        .sort((a, b) => +new Date(a.start) - +new Date(b.start)),
    [exams],
  );

  if (loading) {
    return <Spinner label="A carregar do Google Calendar…" />;
  }
  if (error) {
    return (
      <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-red">
        {error}
      </p>
    );
  }
  if (!exams || exams.length === 0) {
    return (
      <p className="rounded-card border border-edge bg-card p-4 text-[13px] text-muted">
        Nenhum exame encontrado no calendário.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
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

      {view === "lista" ? (
        <div className="space-y-2.5">
          {upcoming.map((e) => (
            <ExamCard key={e.id} exam={e} />
          ))}
        </div>
      ) : (
        <MonthView exams={upcoming} />
      )}
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

function MonthView({ exams }: { exams: ExamDTO[] }) {
  const [offset, setOffset] = useState(0);
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + offset);
  const year = base.getFullYear();
  const month = base.getMonth();

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDay = new Map<number, ExamDTO[]>();
  exams.forEach((e) => {
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
