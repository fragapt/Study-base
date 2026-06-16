import { describe, it, expect } from "vitest";
import { daysUntil, formatTime, dayMonth, countdownLabel } from "./dates";

function isoInDays(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

describe("daysUntil", () => {
  it("returns 0 for today", () => {
    expect(daysUntil(isoInDays(0))).toBe(0);
  });
  it("returns positive for future dates", () => {
    expect(daysUntil(isoInDays(5))).toBe(5);
    expect(daysUntil(isoInDays(1))).toBe(1);
  });
  it("returns negative for past dates", () => {
    expect(daysUntil(isoInDays(-3))).toBe(-3);
  });
});

describe("formatTime", () => {
  it("formats hours and minutes as HH:MM", () => {
    const d = new Date(2026, 5, 16, 14, 30);
    expect(formatTime(d)).toBe("14:30");
  });
});

describe("dayMonth", () => {
  it("returns day number and abbreviated PT month", () => {
    const d = new Date(2026, 5, 16); // June 16
    expect(dayMonth(d)).toEqual({ day: 16, month: "jun" });
  });
  it("maps January to jan and December to dez", () => {
    expect(dayMonth(new Date(2026, 0, 1)).month).toBe("jan");
    expect(dayMonth(new Date(2026, 11, 25)).month).toBe("dez");
  });
});

describe("countdownLabel", () => {
  it("labels today and tomorrow", () => {
    expect(countdownLabel(0)).toBe("HOJE");
    expect(countdownLabel(1)).toBe("amanhã");
  });
  it("labels multiple days ahead and behind", () => {
    expect(countdownLabel(5)).toBe("5 dias");
    expect(countdownLabel(-2)).toBe("há 2 dias");
  });
});
