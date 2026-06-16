import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SubjectBadge from "./SubjectBadge";

describe("SubjectBadge", () => {
  it("renders the subject name for a known slug", () => {
    render(<SubjectBadge slug="eletricidade" />);
    expect(screen.getByText(/Eletricidade/)).toBeInTheDocument();
  });

  it("renders nothing for null slug", () => {
    const { container } = render(<SubjectBadge slug={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an unknown slug", () => {
    const { container } = render(<SubjectBadge slug="inexistente" />);
    expect(container).toBeEmptyDOMElement();
  });
});
