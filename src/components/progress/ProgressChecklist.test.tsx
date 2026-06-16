import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/useProgress", () => ({ useProgress: vi.fn() }));
import { useProgress } from "@/lib/useProgress";
import ProgressChecklist from "./ProgressChecklist";

const mocked = vi.mocked(useProgress);

describe("ProgressChecklist", () => {
  beforeEach(() => mocked.mockReset());

  it("renders progress percentage and topics", () => {
    const toggle = vi.fn();
    mocked.mockReturnValue({
      done: { "Leis de Kirchhoff": true },
      loading: false,
      ready: true,
      toggle,
    });
    render(<ProgressChecklist subjectName="Eletricidade" subjectSlug="eletricidade" />);

    expect(screen.getByText(/1 \/ 12 tópicos/)).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
    expect(screen.getByText("Leis de Kirchhoff")).toBeInTheDocument();
  });

  it("calls toggle when a topic is clicked", () => {
    const toggle = vi.fn();
    mocked.mockReturnValue({ done: {}, loading: false, ready: true, toggle });
    render(<ProgressChecklist subjectName="Eletricidade" subjectSlug="eletricidade" />);

    const buttons = screen.getAllByLabelText("Concluir");
    fireEvent.click(buttons[0]);
    expect(toggle).toHaveBeenCalledWith("Leis de Kirchhoff", true);
  });

  it("shows a config prompt when not ready", () => {
    mocked.mockReturnValue({ done: {}, loading: false, ready: false, toggle: vi.fn() });
    render(<ProgressChecklist subjectName="Eletricidade" subjectSlug="eletricidade" />);
    expect(screen.getByText(/Configura o Supabase/)).toBeInTheDocument();
  });
});
