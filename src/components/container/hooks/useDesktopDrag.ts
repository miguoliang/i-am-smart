import { useState, useCallback, useMemo } from "react";
import React from "react";
import type { ReactNode } from "react";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { WindowPosition, DraggableChildProps } from "../types";

interface UseDesktopDragOptions {
  children: ReactNode;
  onWindowFocus: (windowId: string) => void;
}

interface UseDesktopDragReturn {
  windowPositions: Record<string, WindowPosition>;
  dragStartPositions: Record<string, WindowPosition>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useDesktopDrag({
  children,
  onWindowFocus,
}: UseDesktopDragOptions): UseDesktopDragReturn {
  // Initialize positions from defaultPosition props
  const initialPositions = useMemo(() => {
    const positions: Record<string, WindowPosition> = {};
    let index = 0;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const windowId = `window-${index}`;
        const childProps = child.props as DraggableChildProps;
        const defaultPosition =
          childProps.defaultPosition || {
            x: 50 + index * 20,
            y: 50 + index * 20,
          };
        positions[windowId] = defaultPosition;
        index += 1;
      }
    });
    return positions;
  }, [children]);

  const [windowPositions, setWindowPositions] = useState<Record<string, WindowPosition>>(initialPositions);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, WindowPosition>>({});

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const windowId = event.active.id as string;

      // Bring window to front when dragging starts
      onWindowFocus(windowId);

      // Store the position at drag start - always use current position from state
      setWindowPositions((currentPositions) => {
        const currentPosition = currentPositions[windowId];
        if (currentPosition) {
          setDragStartPositions((prev) => ({
            ...prev,
            [windowId]: currentPosition,
          }));
        }
        return currentPositions;
      });
    },
    [onWindowFocus]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const windowId = active.id as string;

      if (delta && (delta.x !== 0 || delta.y !== 0)) {
        // Get the position at drag start (this is the position before transform was applied)
        const startPosition = dragStartPositions[windowId];

        if (startPosition) {
          // Calculate new position based on start position and delta
          const newPosition = {
            x: Math.max(0, startPosition.x + delta.x),
            y: Math.max(0, startPosition.y + delta.y),
          };

          setWindowPositions((prev) => ({
            ...prev,
            [windowId]: newPosition,
          }));
        } else {
          // Fallback: use current position if start position wasn't stored
          setWindowPositions((currentPositions) => {
            const currentPosition = currentPositions[windowId];
            if (currentPosition) {
              const newPosition = {
                x: Math.max(0, currentPosition.x + delta.x),
                y: Math.max(0, currentPosition.y + delta.y),
              };

              return {
                ...currentPositions,
                [windowId]: newPosition,
              };
            }
            return currentPositions;
          });
        }

        // Clear the drag start position
        setDragStartPositions((prev) => {
          const next = { ...prev };
          delete next[windowId];
          return next;
        });
      }
    },
    [dragStartPositions]
  );

  return {
    windowPositions,
    dragStartPositions,
    handleDragStart,
    handleDragEnd,
  };
}
