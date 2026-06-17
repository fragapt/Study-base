import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import {
  renderWithConfig,
  subjectRow,
  topicRow,
} from "@/test/renderWithConfig";

vi.mock("@/lib/useProgress", () => ({ useProgress: vi.fn() }));
import { useProgress } from "@/lib/useProgress";
import ProgressChecklist from "./ProgressChecklist";

const mocked = vi.mocked(useProgress);

// 12 topics for subject s1; the first is "Leis de Kirchhoff".
const topics = Array.from({ length: 12 }, (_, i) =>
  topicRow({
    id: `t${i + 1}`,
    title: i === 0 ? "Leis de Kirchhoff" : `Tópico ${i + 1}`,
    position: i,
  }),
);
const config = { subjects: [subjectRow()], topics };

describe("ProgressChecklist", () => {
  beforeEach(() => mocked.mockReset());

  it("renders progress percentage and topics", () => {
    mocked.mockReturnValue({
      done: { t1: true },
      loading: false,
      ready: true,
      toggle: vi.fn(),
    });
    renderWithConfig(<ProgressChecklist subjectId="s1" />, config);

    expect(screen.getByText(/1 \/ 12 tarefas/)).toBeInTheDocument();
    expect(screen.getByText("8%")).toBeInTheDocument();
    expect(screen.getByText("Leis de Kirchhoff")).toBeInTheDocument();
  });

  it("calls toggle when a topic is clicked", () => {
    const toggle = vi.fn();
    mocked.mockReturnValue({ done: {}, loading: false, ready: true, toggle });
    renderWithConfig(<ProgressChecklist subjectId="s1" />, config);

    const buttons = screen.getAllByLabelText("Concluir");
    fireEvent.click(buttons[0]);
    expect(toggle).toHaveBeenCalledWith("t1", true);
  });

  it("shows a config prompt when not ready", () => {
    mocked.mockReturnValue({ done: {}, loading: false, ready: false, toggle: vi.fn() });
    renderWithConfig(<ProgressChecklist subjectId="s1" />, config);
    expect(screen.getByText(/Configura o Supabase/)).toBeInTheDocument();
  });
});
