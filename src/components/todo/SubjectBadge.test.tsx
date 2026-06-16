import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import SubjectBadge from "./SubjectBadge";
import { renderWithConfig, subjectRow } from "@/test/renderWithConfig";

const config = { subjects: [subjectRow()] };

describe("SubjectBadge", () => {
  it("renders the subject name for a known slug", () => {
    renderWithConfig(<SubjectBadge slug="eletricidade" />, config);
    expect(screen.getByText(/Eletricidade/)).toBeInTheDocument();
  });

  it("renders nothing for null slug", () => {
    const { container } = renderWithConfig(<SubjectBadge slug={null} />, config);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for an unknown slug", () => {
    const { container } = renderWithConfig(
      <SubjectBadge slug="inexistente" />,
      config,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
