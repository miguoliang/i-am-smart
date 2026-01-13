"use client";

import type { ReactNode } from "react";
import React, { useCallback, useMemo } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { WindowPosition, DraggableChildProps } from "./types";
import { useDesktopDrag } from "./hooks/useDesktopDrag";
import { useWindowZIndex } from "./hooks/useWindowZIndex";

interface DesktopProps {
  children: ReactNode;
  className?: string;
  background?: string;
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
  const handleClick = useCallback(() => {
    // Only bring to front if clicking on the window itself, not if it's a drag
    if (!isDragging) {
      onFocus();
    }
  }, [onFocus, isDragging]);

  // Handle mouse down to bring window to front immediately
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Stop propagation to prevent conflicts
      e.stopPropagation();
      // Bring to front on mouse down (before drag starts)
      onFocus();
      // Call original onMouseDown if it exists
      if (React.isValidElement(children)) {
        const originalOnMouseDown = (children.props as DraggableChildProps)?.onMouseDown;
        if (originalOnMouseDown) {
          originalOnMouseDown(e);
        }
      }
    },
    [onFocus, children]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onFocus();
      }
    },
    [onFocus]
  );

  // Clone the child and pass drag props
  const childWithDrag = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<DraggableChildProps>,
        {
          ref: setNodeRef,
          style: {
            ...((children.props as DraggableChildProps)?.style || {}),
            ...style,
          },
          "data-dragging": isDragging,
          "aria-label": `Draggable window ${id}`,
          "aria-describedby": `${id}-description`,
          role: "application",
          tabIndex: 0,
          dragAttributes: attributes,
          dragListeners: listeners,
          onClick: handleClick,
          onMouseDown: handleMouseDown,
          onKeyDown: handleKeyDown,
        } as Partial<DraggableChildProps> & { ref: typeof setNodeRef; "aria-label": string; "aria-describedby": string; role: string; tabIndex: number }
      )
    : children;

  return <>{childWithDrag}</>;
}

export function Desktop({ children, className, background }: DesktopProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: "desktop",
  });

  // Use custom hooks for drag and z-index management
  const { bringToFront, getZIndex } = useWindowZIndex({ children });

  const handleWindowFocus = useCallback(
    (windowId: string) => {
      bringToFront(windowId);
    },
    [bringToFront]
  );

  const { windowPositions, handleDragStart, handleDragEnd } = useDesktopDrag({
    children,
    onWindowFocus: handleWindowFocus,
  });

  // Clone children and wrap them in DraggableWindow
  // Memoize to avoid re-processing children on every render
  // Only recompute when children, positions, or z-indices change
  const childrenWithDrag = useMemo(() => {
    return React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        const windowId = `window-${index}`;
        const currentPosition = windowPositions[windowId];
        // Default z-index is based on index, but can be overridden by windowZIndices
        const zIndex = getZIndex(windowId, index + 1);

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
  }, [children, windowPositions, getZIndex, handleWindowFocus]);

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
        role="application"
        aria-label="Desktop workspace with draggable windows"
      >
        {childrenWithDrag}
      </div>
    </DndContext>
  );
}
