import { MONTHS_PT } from "./constants";

// Whole days from today (local) to the given date. 0 = today, negative = past.
export function daysUntil(dateLike: string | Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

export function formatTime(dateLike: string | Date): string {
  return new Date(dateLike).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function dayMonth(dateLike: string | Date): { day: number; month: string } {
  const d = new Date(dateLike);
  return { day: d.getDate(), month: MONTHS_PT[d.getMonth()] };
}

export function countdownLabel(days: number): string {
  if (days === 0) return "HOJE";
  if (days === 1) return "amanhã";
  if (days < 0) return `há ${Math.abs(days)} dias`;
  return `${days} dias`;
}
