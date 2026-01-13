/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useDesktopDrag } from "./useDesktopDrag";
import { MacOSWindow } from "../MacOSWindow";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";

describe("useDesktopDrag", () => {
  const mockOnWindowFocus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize positions from defaultPosition props", () => {
      const children = (
        <MacOSWindow title="Window 1" defaultPosition={{ x: 100, y: 200 }}>
          Content
        </MacOSWindow>
      );

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      expect(result.current.windowPositions["window-0"]).toEqual({ x: 100, y: 200 });
    });

    it("should use default positions when defaultPosition is not provided", () => {
      const children = [
        <MacOSWindow key="1" title="Window 1">Content 1</MacOSWindow>,
        <MacOSWindow key="2" title="Window 2">Content 2</MacOSWindow>,
      ];

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      expect(result.current.windowPositions["window-0"]).toEqual({ x: 50, y: 50 });
      expect(result.current.windowPositions["window-1"]).toEqual({ x: 70, y: 70 });
    });

    it("should initialize empty dragStartPositions", () => {
      const children = <MacOSWindow title="Window 1">Content</MacOSWindow>;

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      expect(result.current.dragStartPositions).toEqual({});
    });
  });

  describe("handleDragStart", () => {
    it("should call onWindowFocus when drag starts", () => {
      const children = <MacOSWindow title="Window 1">Content</MacOSWindow>;

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      const event = {
        active: { id: "window-0" },
      } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(mockOnWindowFocus).toHaveBeenCalledWith("window-0");
    });

    it("should store drag start position", () => {
      const children = (
        <MacOSWindow title="Window 1" defaultPosition={{ x: 100, y: 200 }}>
          Content
        </MacOSWindow>
      );

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      const event = {
        active: { id: "window-0" },
      } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(event);
      });

      expect(result.current.dragStartPositions["window-0"]).toEqual({ x: 100, y: 200 });
    });
  });

  describe("handleDragEnd", () => {
    it("should update position based on delta", () => {
      const children = (
        <MacOSWindow title="Window 1" defaultPosition={{ x: 100, y: 200 }}>
          Content
        </MacOSWindow>
      );

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      // Start drag to store start position
      const startEvent = {
        active: { id: "window-0" },
      } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(startEvent);
      });

      // End drag with delta
      const endEvent = {
        active: { id: "window-0" },
        delta: { x: 50, y: 75 },
      } as DragEndEvent;

      act(() => {
        result.current.handleDragEnd(endEvent);
      });

      expect(result.current.windowPositions["window-0"]).toEqual({ x: 150, y: 275 });
    });

    it("should not update position if delta is zero", () => {
      const children = (
        <MacOSWindow title="Window 1" defaultPosition={{ x: 100, y: 200 }}>
          Content
        </MacOSWindow>
      );

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      const initialPosition = result.current.windowPositions["window-0"];

      const endEvent = {
        active: { id: "window-0" },
        delta: { x: 0, y: 0 },
      } as DragEndEvent;

      act(() => {
        result.current.handleDragEnd(endEvent);
      });

      expect(result.current.windowPositions["window-0"]).toEqual(initialPosition);
    });

    it("should prevent negative positions", () => {
      const children = (
        <MacOSWindow title="Window 1" defaultPosition={{ x: 10, y: 10 }}>
          Content
        </MacOSWindow>
      );

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      const startEvent = {
        active: { id: "window-0" },
      } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(startEvent);
      });

      const endEvent = {
        active: { id: "window-0" },
        delta: { x: -50, y: -50 },
      } as DragEndEvent;

      act(() => {
        result.current.handleDragEnd(endEvent);
      });

      expect(result.current.windowPositions["window-0"]).toEqual({ x: 0, y: 0 });
    });

    it("should clear drag start position after drag ends", () => {
      const children = (
        <MacOSWindow title="Window 1" defaultPosition={{ x: 100, y: 200 }}>
          Content
        </MacOSWindow>
      );

      const { result } = renderHook(() =>
        useDesktopDrag({
          children,
          onWindowFocus: mockOnWindowFocus,
        })
      );

      const startEvent = {
        active: { id: "window-0" },
      } as DragStartEvent;

      act(() => {
        result.current.handleDragStart(startEvent);
      });

      expect(result.current.dragStartPositions["window-0"]).toBeDefined();

      const endEvent = {
        active: { id: "window-0" },
        delta: { x: 10, y: 10 },
      } as DragEndEvent;

      act(() => {
        result.current.handleDragEnd(endEvent);
      });

      expect(result.current.dragStartPositions["window-0"]).toBeUndefined();
    });
  });
});
