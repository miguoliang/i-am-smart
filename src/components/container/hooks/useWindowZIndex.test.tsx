/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useWindowZIndex } from "./useWindowZIndex";
import { MacOSWindow } from "../MacOSWindow";

describe("useWindowZIndex", () => {
  describe("Initialization", () => {
    it("should initialize z-indices based on children count", () => {
      const children = [
        <MacOSWindow key="1" title="Window 1">Content 1</MacOSWindow>,
        <MacOSWindow key="2" title="Window 2">Content 2</MacOSWindow>,
      ];

      const { result } = renderHook(() => useWindowZIndex({ children }));

      expect(result.current.windowZIndices["window-0"]).toBe(1);
      expect(result.current.windowZIndices["window-1"]).toBe(2);
    });

    it("should provide bringToFront function", () => {
      const children = <MacOSWindow title="Window 1">Content</MacOSWindow>;

      const { result } = renderHook(() => useWindowZIndex({ children }));

      expect(typeof result.current.bringToFront).toBe("function");
    });

    it("should provide getZIndex function", () => {
      const children = <MacOSWindow title="Window 1">Content</MacOSWindow>;

      const { result } = renderHook(() => useWindowZIndex({ children }));

      expect(typeof result.current.getZIndex).toBe("function");
    });
  });

  describe("bringToFront", () => {
    it("should bring window to front and increment z-index", () => {
      const children = (
        <>
          <MacOSWindow title="Window 1">Content 1</MacOSWindow>
          <MacOSWindow title="Window 2">Content 2</MacOSWindow>
        </>
      );

      const { result } = renderHook(() => useWindowZIndex({ children }));

      const initialZIndex = result.current.windowZIndices["window-0"];

      act(() => {
        result.current.bringToFront("window-0");
      });

      expect(result.current.windowZIndices["window-0"]).toBeGreaterThan(initialZIndex);
    });

    it("should increment max z-index on each call", () => {
      const children = [
        <MacOSWindow key="1" title="Window 1">Content 1</MacOSWindow>,
        <MacOSWindow key="2" title="Window 2">Content 2</MacOSWindow>,
      ];

      const { result } = renderHook(() => useWindowZIndex({ children }));

      act(() => {
        result.current.bringToFront("window-0");
      });

      const firstZIndex = result.current.windowZIndices["window-0"];

      act(() => {
        result.current.bringToFront("window-1");
      });

      const secondZIndex = result.current.windowZIndices["window-1"];

      expect(secondZIndex).toBeGreaterThan(firstZIndex);
    });
  });

  describe("getZIndex", () => {
    it("should return z-index for existing window", () => {
      const children = [
        <MacOSWindow key="1" title="Window 1">Content 1</MacOSWindow>,
        <MacOSWindow key="2" title="Window 2">Content 2</MacOSWindow>,
      ];

      const { result } = renderHook(() => useWindowZIndex({ children }));

      const zIndex = result.current.getZIndex("window-0", 999);
      expect(zIndex).toBe(1);
    });

    it("should return fallback index for non-existent window", () => {
      const children = <MacOSWindow title="Window 1">Content</MacOSWindow>;

      const { result } = renderHook(() => useWindowZIndex({ children }));

      const zIndex = result.current.getZIndex("window-999", 42);
      expect(zIndex).toBe(42);
    });
  });
});
