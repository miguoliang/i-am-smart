/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { IPadFrame } from "./IPadFrame";

describe("IPadFrame", () => {
  describe("Rendering", () => {
    it("should render iPad frame with children", () => {
      render(
        <IPadFrame>
          <div>Test Content</div>
        </IPadFrame>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should render with light variant by default", () => {
      const { container } = render(
        <IPadFrame>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("bg-gray-900");
    });

    it("should render with dark variant", () => {
      const { container } = render(
        <IPadFrame variant="dark">
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("bg-black");
    });

    it("should render in portrait orientation by default", () => {
      const { container } = render(
        <IPadFrame>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("w-[768px]");
      expect(frame).toHaveClass("h-[1024px]");
    });

    it("should render in landscape orientation", () => {
      const { container } = render(
        <IPadFrame orientation="landscape">
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("w-[1024px]");
      expect(frame).toHaveClass("h-[768px]");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <IPadFrame className="custom-class">
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("custom-class");
    });

    it("should apply custom style", () => {
      const { container } = render(
        <IPadFrame style={{ opacity: 0.5 }}>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame.style.opacity).toBe("0.5");
    });
  });

  describe("Orientation", () => {
    it("should have portrait dimensions by default", () => {
      const { container } = render(
        <IPadFrame>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("w-[768px]");
      expect(frame).toHaveClass("h-[1024px]");
    });

    it("should have landscape dimensions when orientation is landscape", () => {
      const { container } = render(
        <IPadFrame orientation="landscape">
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("w-[1024px]");
      expect(frame).toHaveClass("h-[768px]");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA label for portrait orientation", () => {
      render(
        <IPadFrame>
          <div>Content</div>
        </IPadFrame>
      );

      expect(screen.getByRole("application", { name: /ipad frame in portrait orientation/i })).toBeInTheDocument();
    });

    it("should have proper ARIA label for landscape orientation", () => {
      render(
        <IPadFrame orientation="landscape">
          <div>Content</div>
        </IPadFrame>
      );

      expect(screen.getByRole("application", { name: /ipad frame in landscape orientation/i })).toBeInTheDocument();
    });

    it("should have proper role attribute", () => {
      const { container } = render(
        <IPadFrame>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.querySelector('[role="application"]');
      expect(frame).toBeInTheDocument();
    });

    it("should be keyboard focusable", () => {
      const { container } = render(
        <IPadFrame>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.querySelector('[tabIndex="0"]');
      expect(frame).toBeInTheDocument();
    });
  });

  describe("Drag and Drop Props", () => {
    it("should accept drag attributes", () => {
      const dragAttributes = { "data-testid": "draggable" };
      const { container } = render(
        <IPadFrame dragAttributes={dragAttributes}>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveAttribute("data-testid", "draggable");
    });

    it("should apply dragging state class when data-dragging is true", () => {
      const { container } = render(
        <IPadFrame data-dragging={true}>
          <div>Content</div>
        </IPadFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("cursor-grabbing");
    });
  });
});
