import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/exames",
}));

describe("Sidebar", () => {
  it("renders all nav items", () => {
    render(<Sidebar />);
    ["Dashboard", "Exames", "Drives", "To-do", "Cadeiras", "Progresso", "Definições"].forEach(
      (label) => expect(screen.getByText(label)).toBeInTheDocument(),
    );
  });

  it("marks the active route with the accent style", () => {
    render(<Sidebar />);
    const active = screen.getByText("Exames").closest("a");
    expect(active?.className).toContain("text-accent");
    const inactive = screen.getByText("Drives").closest("a");
    expect(inactive?.className).not.toContain("text-accent");
  });
});
