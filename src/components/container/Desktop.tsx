"use client";

import type { ReactNode } from "react";
import React, { useState, useCallback, useMemo } from "react";
import { DndContext, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface DesktopProps {
  children: ReactNode;
  className?: string;
  background?: string;
}

interface WindowPosition {
  x: number;
  y: number;
}

interface DraggableWindowProps {
  id: string;
  children: ReactNode;
  position: WindowPosition;
  zIndex: number;
  onFocus: () => void;
}

function DraggableWindow({ id, children, position, zIndex, onFocus }: DraggableWindowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    left: `${position.x}px`,
    top: `${position.y}px`,
    position: "absolute" as const,
    zIndex,
  };

  // Handle click to bring window to front
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Only bring to front if clicking on the window itself, not if it's a drag
      if (!isDragging) {
        onFocus();
      }
    },
    [onFocus, isDragging]
  );

  // Handle mouse down to bring window to front immediately
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Stop propagation to prevent conflicts
      e.stopPropagation();
      // Bring to front on mouse down (before drag starts)
      onFocus();
      // Call original onMouseDown if it exists
      if (React.isValidElement(children)) {
        const originalOnMouseDown = (children.props as { onMouseDown?: (e: React.MouseEvent) => void })
          ?.onMouseDown;
        if (originalOnMouseDown) {
          originalOnMouseDown(e);
        }
      }
    },
    [onFocus, children]
  );

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
        onClick: handleClick,
        onMouseDown: handleMouseDown,
      })
    : children;

  return <>{childWithDrag}</>;
}

export function Desktop({ children, className, background }: DesktopProps) {
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
  
  // Initialize z-indices based on children count
  const initialZIndices = useMemo(() => {
    const zIndices: Record<string, number> = {};
    React.Children.forEach(children, (child, index) => {
      if (React.isValidElement(child)) {
        const windowId = `window-${index}`;
        zIndices[windowId] = index + 1;
      }
    });
    return zIndices;
  }, [children]);
  
  const [windowZIndices, setWindowZIndices] = useState<Record<string, number>>(initialZIndices);
  const [maxZIndex, setMaxZIndex] = useState(React.Children.count(children));

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "desktop",
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const windowId = event.active.id as string;

      // Bring window to front when dragging starts
      setMaxZIndex((prev) => {
        const newZIndex = prev + 1;
        setWindowZIndices((zIndices) => ({
          ...zIndices,
          [windowId]: newZIndex,
        }));
        return newZIndex;
      });

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

  const handleWindowFocus = useCallback((windowId: string) => {
    setMaxZIndex((prev) => {
      const newZIndex = prev + 1;
      setWindowZIndices((zIndices) => ({
        ...zIndices,
        [windowId]: newZIndex,
      }));
      return newZIndex;
    });
  }, []);

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
      // Default z-index is based on index, but can be overridden by windowZIndices
      const zIndex = windowZIndices[windowId] || index + 1;

      return (
        <DraggableWindow
          key={windowId}
          id={windowId}
          position={currentPosition}
          zIndex={zIndex}
          onFocus={() => handleWindowFocus(windowId)}
        >
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
          "relative w-full h-full min-h-[600px] overflow-hidden",
          !background && "bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800",
          isOver && "ring-2 ring-blue-400 ring-offset-2",
          className
        )}
        style={background ? { background } : undefined}
      >
        {childrenWithDrag}
      </div>
    </DndContext>
  );
}
