import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ExamCard from "./ExamCard";
import type { ExamDTO } from "@/lib/exam";

function isoInDays(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function exam(partial: Partial<ExamDTO>): ExamDTO {
  return { id: "e1", title: "Eletricidade testes", start: isoInDays(5), allDay: false, ...partial };
}

describe("ExamCard", () => {
  it("shows the title and a days countdown", () => {
    render(<ExamCard exam={exam({ start: isoInDays(5) })} />);
    expect(screen.getByText("Eletricidade testes")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("dias")).toBeInTheDocument();
  });

  it("shows HOJE for today's exam", () => {
    render(<ExamCard exam={exam({ start: isoInDays(0) })} />);
    expect(screen.getByText("HOJE")).toBeInTheDocument();
  });

  it("singularises 'dia' for tomorrow", () => {
    render(<ExamCard exam={exam({ start: isoInDays(1) })} />);
    expect(screen.getByText("dia")).toBeInTheDocument();
  });

  it("renders location when present", () => {
    render(<ExamCard exam={exam({ location: "Sala B1" })} />);
    expect(screen.getByText(/Sala B1/)).toBeInTheDocument();
  });
});
