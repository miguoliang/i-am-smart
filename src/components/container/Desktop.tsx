"use client";

import type { ReactNode } from "react";
import React, { useState, useCallback, useMemo } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface DesktopProps {
  children: ReactNode;
  className?: string;
}

interface WindowPosition {
  x: number;
  y: number;
}

interface DraggableWindowProps {
  id: string;
  children: ReactNode;
  position: WindowPosition;
}

function DraggableWindow({ id, children, position }: DraggableWindowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${position.x}px`,
    top: `${position.y}px`,
    position: "absolute" as const,
  };

  // Clone the child and pass drag props
  const childWithDrag = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        ref: setNodeRef,
        style: {
          ...((children.props as { style?: React.CSSProperties })?.style || {}),
          ...style,
        },
        "data-dragging": isDragging,
        dragAttributes: attributes,
        dragListeners: listeners,
      })
    : children;

  return <>{childWithDrag}</>;
}

export function Desktop({ children, className }: DesktopProps) {
  // Initialize positions from defaultPosition props
  const initialPositions = useMemo(() => {
    const positions: Record<string, WindowPosition> = {};
    React.Children.forEach(children, (child, index) => {
      if (React.isValidElement(child)) {
        const windowId = `window-${index}`;
        const childProps = child.props as Record<string, unknown>;
        const defaultPosition = (childProps.defaultPosition || {
          x: 50 + index * 20,
          y: 50 + index * 20,
        }) as WindowPosition;
        positions[windowId] = defaultPosition;
      }
    });
    return positions;
  }, [children]);

  const [windowPositions, setWindowPositions] = useState<Record<string, WindowPosition>>(initialPositions);
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, WindowPosition>>({});

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "desktop",
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const windowId = event.active.id as string;

      // Store the position at drag start
      setDragStartPositions((prev) => {
        const currentPosition = windowPositions[windowId];
        if (currentPosition) {
          return { ...prev, [windowId]: currentPosition };
        }
        return prev;
      });
    },
    [windowPositions]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, delta } = event;
      const windowId = active.id as string;

      if (delta) {
        // Get the position at drag start (this is the position before transform was applied)
        const startPosition = dragStartPositions[windowId] || windowPositions[windowId];

        if (startPosition) {
          const newPosition = {
            x: Math.max(0, startPosition.x + delta.x),
            y: Math.max(0, startPosition.y + delta.y),
          };

          setWindowPositions((prev) => ({
            ...prev,
            [windowId]: newPosition,
          }));
        }

        // Clear the drag start position
        setDragStartPositions((prev) => {
          const next = { ...prev };
          delete next[windowId];
          return next;
        });
      }
    },
    [dragStartPositions, windowPositions]
  );

  // Clone children and wrap them in DraggableWindow
  const childrenWithDrag = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      const windowId = `window-${index}`;
      const currentPosition = windowPositions[windowId];

      return (
        <DraggableWindow key={windowId} id={windowId} position={currentPosition}>
          {child}
        </DraggableWindow>
      );
    }
    return child;
  });

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={setDroppableRef}
        className={cn(
          "relative w-full h-full min-h-[600px] bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 overflow-hidden",
          isOver && "ring-2 ring-blue-400 ring-offset-2",
          className
        )}
      >
        {childrenWithDrag}
      </div>
    </DndContext>
  );
}
