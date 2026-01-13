/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { IPhoneFrame } from "./IPhoneFrame";

describe("IPhoneFrame", () => {
  describe("Rendering", () => {
    it("should render iPhone frame with children", () => {
      render(
        <IPhoneFrame>
          <div>Test Content</div>
        </IPhoneFrame>
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("should render with light variant by default", () => {
      const { container } = render(
        <IPhoneFrame>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("bg-gray-900");
    });

    it("should render with dark variant", () => {
      const { container } = render(
        <IPhoneFrame variant="dark">
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("bg-black");
    });

    it("should apply custom className", () => {
      const { container } = render(
        <IPhoneFrame className="custom-class">
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("custom-class");
    });

    it("should apply custom style", () => {
      const { container } = render(
        <IPhoneFrame style={{ opacity: 0.5 }}>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame.style.opacity).toBe("0.5");
    });
  });

  describe("Dimensions", () => {
    it("should have correct iPhone dimensions", () => {
      const { container } = render(
        <IPhoneFrame>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("w-[375px]");
      expect(frame).toHaveClass("h-[812px]");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA label", () => {
      render(
        <IPhoneFrame>
          <div>Content</div>
        </IPhoneFrame>
      );

      expect(screen.getByRole("application", { name: /iphone frame/i })).toBeInTheDocument();
    });

    it("should have proper role attribute", () => {
      const { container } = render(
        <IPhoneFrame>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.querySelector('[role="application"]');
      expect(frame).toBeInTheDocument();
    });

    it("should be keyboard focusable", () => {
      const { container } = render(
        <IPhoneFrame>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.querySelector('[tabIndex="0"]');
      expect(frame).toBeInTheDocument();
    });
  });

  describe("Drag and Drop Props", () => {
    it("should accept drag attributes", () => {
      const dragAttributes = { "data-testid": "draggable" };
      const { container } = render(
        <IPhoneFrame dragAttributes={dragAttributes}>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveAttribute("data-testid", "draggable");
    });

    it("should apply dragging state class when data-dragging is true", () => {
      const { container } = render(
        <IPhoneFrame data-dragging={true}>
          <div>Content</div>
        </IPhoneFrame>
      );

      const frame = container.firstChild as HTMLElement;
      expect(frame).toHaveClass("cursor-grabbing");
    });
  });
});
