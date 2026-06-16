import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NoteItem from "./NoteItem";
import type { NoteRow } from "@/lib/supabase/types";

function note(partial: Partial<NoteRow> = {}): NoteRow {
  return {
    id: "n1",
    user_id: "u1",
    subject_slug: "eletricidade",
    title: "Estudar Kirchhoff",
    description: "leis das malhas",
    done: false,
    due_date: null,
    position: 0,
    created_at: new Date().toISOString(),
    ...partial,
  };
}

describe("NoteItem", () => {
  it("renders title, description and subject badge", () => {
    render(<NoteItem note={note()} onToggle={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Estudar Kirchhoff")).toBeInTheDocument();
    expect(screen.getByText("leis das malhas")).toBeInTheDocument();
    expect(screen.getByText(/Eletricidade/)).toBeInTheDocument();
  });

  it("calls onToggle with the inverted done state", () => {
    const onToggle = vi.fn();
    render(<NoteItem note={note({ done: false })} onToggle={onToggle} onDelete={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Concluir"));
    expect(onToggle).toHaveBeenCalledWith("n1", true);
  });

  it("calls onDelete with the note id", () => {
    const onDelete = vi.fn();
    render(<NoteItem note={note()} onToggle={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText("Eliminar"));
    expect(onDelete).toHaveBeenCalledWith("n1");
  });
});
