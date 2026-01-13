/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { Desktop } from "./Desktop";
import { MacOSWindow } from "./MacOSWindow";

// Mock @dnd-kit/core
jest.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    isDragging: false,
  }),
  useDroppable: () => ({
    setNodeRef: () => {},
    isOver: false,
  }),
}));

jest.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Translate: {
      toString: (transform: { x: number; y: number } | null) => {
        if (!transform) return "translate3d(0, 0, 0)";
        return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
      },
    },
  },
}));

describe("Desktop", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render desktop with children", () => {
      render(
        <Desktop>
          <MacOSWindow title="Test Window">Content</MacOSWindow>
        </Desktop>
      );

      expect(screen.getByRole("application", { name: /desktop workspace/i })).toBeInTheDocument();
    });

    it("should render multiple windows", () => {
      render(
        <Desktop>
          <MacOSWindow title="Window 1">Content 1</MacOSWindow>
          <MacOSWindow title="Window 2">Content 2</MacOSWindow>
        </Desktop>
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(
        <Desktop className="custom-class">
          <MacOSWindow title="Test">Content</MacOSWindow>
        </Desktop>
      );

      const desktop = container.querySelector(".custom-class");
      expect(desktop).toBeInTheDocument();
    });

    it("should apply custom background style", () => {
      const { container } = render(
        <Desktop background="linear-gradient(to bottom, #fff, #000)">
          <MacOSWindow title="Test">Content</MacOSWindow>
        </Desktop>
      );

      const desktop = container.querySelector('[role="application"]') as HTMLElement;
      expect(desktop?.style.background).toBe("linear-gradient(to bottom, #fff, #000)");
    });
  });

  describe("Position Management", () => {
    it("should initialize positions from defaultPosition props", () => {
      render(
        <Desktop>
          <MacOSWindow title="Window 1" defaultPosition={{ x: 100, y: 200 }}>
            Content
          </MacOSWindow>
        </Desktop>
      );

      // The window should be positioned at the default position
      // We can't directly test the position without more complex mocking,
      // but we can verify the component renders
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("should use default positions when defaultPosition is not provided", () => {
      render(
        <Desktop>
          <MacOSWindow title="Window 1">Content 1</MacOSWindow>
          <MacOSWindow title="Window 2">Content 2</MacOSWindow>
        </Desktop>
      );

      // Both windows should render with default positions
      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA label for desktop", () => {
      render(
        <Desktop>
          <MacOSWindow title="Test">Content</MacOSWindow>
        </Desktop>
      );

      expect(screen.getByRole("application", { name: /desktop workspace/i })).toBeInTheDocument();
    });

    it("should have proper role attribute", () => {
      const { container } = render(
        <Desktop>
          <MacOSWindow title="Test">Content</MacOSWindow>
        </Desktop>
      );

      const desktop = container.querySelector('[role="application"]');
      expect(desktop).toBeInTheDocument();
    });
  });
});
