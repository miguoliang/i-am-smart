"use client";

import type { ReactNode } from "react";
import React, { useCallback, useMemo } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/form/Button";
import type { WindowPosition, DraggableChildProps } from "./types";
import { useDesktopDrag } from "./hooks/useDesktopDrag";
import { useWindowZIndex } from "./hooks/useWindowZIndex";
import { wrapDragListeners } from "./hooks/wrapDragListeners";

export interface DesktopProps {
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

  // Get child's style to extract scale
  const childStyle = React.isValidElement(children)
    ? ((children.props as DraggableChildProps)?.style || {})
    : {};
  
  const childTransform = childStyle.transform as string | undefined;

  // Combine transforms: translate first (drag), then child transforms (e.g. scale)
  // We apply drag translation first so that it operates in the parent's coordinate system (screen coordinates),
  // ensuring the window moves 1:1 with the mouse cursor regardless of any scaling applied by the child.
  const combinedTransform = React.useMemo(() => {
    const transforms: string[] = [];
    
    // Always add translate transform from drag (even if null/zero, @dnd-kit needs it for real-time updates)
    const translateStr = CSS.Translate.toString(transform);
    if (translateStr) {
      transforms.push(translateStr);
    }
    
    // Add child transform (e.g. scale) AFTER translate
    if (childTransform) {
      transforms.push(childTransform);
    }
    
    return transforms.length > 0 ? transforms.join(" ") : undefined;
  }, [transform, childTransform]);

  const style: React.CSSProperties = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    position: "absolute" as const,
    zIndex,
  };

  // Only add transform if it exists
  if (combinedTransform) {
    style.transform = combinedTransform;
  }
  
  // Add transformOrigin if scale exists
  if (childTransform) {
    style.transformOrigin = childStyle.transformOrigin || "top left";
  }

  // Check if click is inside content area (should not trigger drag/focus)
  const isClickInContentArea = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    const element = target as Element;
    // Check if target is inside a content area using data attribute
    // Content areas are marked with data-content-area="true"
    const contentArea = element.closest('[data-content-area="true"]');
    return contentArea !== null;
  }, []);

  // Handle click to bring window to front
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't bring to front if clicking inside content area or if it's a drag
      if (isClickInContentArea(e.target)) {
        return; // Allow click to propagate to content
      }
      if (!isDragging) {
        onFocus();
      }
    },
    [onFocus, isDragging, isClickInContentArea]
  );

  // Handle mouse down to bring window to front immediately
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't handle if clicking inside content area
      if (isClickInContentArea(e.target)) {
        return; // Allow event to propagate to content
      }
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
    [onFocus, children, isClickInContentArea]
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
  // Remove transform from child style since we're merging it with drag transform
  const childStyleWithoutTransform = React.isValidElement(children)
    ? (() => {
        const originalStyle = (children.props as DraggableChildProps)?.style || {};
        // Filter out transform and transformOrigin properties
        return Object.fromEntries(
          Object.entries(originalStyle).filter(
            ([key]) => key !== "transform" && key !== "transformOrigin"
          )
        ) as React.CSSProperties;
      })()
    : {};

  // Wrap drag listeners to only activate when not clicking in content area
  const wrappedDragListeners = React.useMemo(
    () => wrapDragListeners(listeners, isClickInContentArea),
    [listeners, isClickInContentArea]
  );

  const clientOnlyProps = {
    "data-dragging": isDragging,
    "aria-label": `Draggable window ${id}`,
    "aria-describedby": `${id}-description`,
    role: "application",
    tabIndex: 0,
    dragAttributes: attributes,
    dragListeners: wrappedDragListeners,
    onClick: handleClick,
    onMouseDown: handleMouseDown,
    onKeyDown: handleKeyDown,
  };

  const childWithDrag = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<DraggableChildProps>,
        {
          ref: setNodeRef,
          style: {
            ...childStyleWithoutTransform,
            ...style,
          },
          ...clientOnlyProps,
        }
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

  const { windowPositions, handleDragStart, handleDragEnd, resetPositions } = useDesktopDrag({
    children,
    onWindowFocus: handleWindowFocus,
  });

  // Clone children and wrap them in DraggableWindow
  const childrenWithDrag = useMemo(() => {
    return React.Children.map(children, (child, index) => {
      if (React.isValidElement(child)) {
        const windowId = `window-${index}`;
        const currentPosition = windowPositions[windowId];
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
  
  const containerClassName = cn(
    "relative w-full h-full min-h-[600px] overflow-hidden",
    !background && "bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800",
    className
  );

  // Render the full interactive component only on the client.
  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={setDroppableRef}
        className={cn(
          containerClassName,
          isOver && "ring-2 ring-blue-400 ring-offset-2"
        )}
        style={background ? { background } : undefined}
        role="application"
        aria-label="Desktop workspace with draggable windows"
        suppressHydrationWarning
      >
        {childrenWithDrag}
        {/* Reset button in bottom right corner */}
        <Button
          variant="outline"
          size="icon"
          onClick={resetPositions}
          className="absolute bottom-4 right-4 z-50 shadow-lg"
          aria-label="Reset window positions"
          title="Reset window positions"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </DndContext>
  );
}
