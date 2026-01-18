"use client";

import type { ReactNode } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import type { WindowPosition } from "./types";
import { useScaledStyle } from "./hooks/useScaledStyle";

interface IPadFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className"> {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
  orientation?: "portrait" | "landscape";
  defaultPosition?: WindowPosition;
  scale?: number;
  style?: React.CSSProperties;
  "data-dragging"?: boolean;
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
}

export const IPadFrame = React.forwardRef<HTMLDivElement, IPadFrameProps>(
  function IPadFrame(
    {
      children,
      className,
      variant = "light",
      orientation = "portrait",
      scale = 1,
      style,
      defaultPosition,
      "data-dragging": isDragging,
      dragAttributes,
      dragListeners,
      ...props
    },
    ref
  ) {
    // Extract defaultPosition to prevent it from being passed to DOM (used by useDesktopDrag hook)
    void defaultPosition;
    
    const isLandscape = orientation === "landscape";
    const dimensions = isLandscape
      ? "w-[1024px] h-[768px]"
      : "w-[768px] h-[1024px]";

    const scaledStyle = useScaledStyle(scale, style);

    return (
      <div
        ref={ref}
        className={cn(
          "relative mx-auto rounded-4xl p-3 cursor-grab active:cursor-grabbing",
          dimensions,
          variant === "light"
            ? "bg-gray-900 shadow-2xl"
            : "bg-black shadow-2xl",
          isDragging && "cursor-grabbing",
          className
        )}
        style={scaledStyle}
        role="application"
        aria-label={`iPad frame in ${orientation} orientation`}
        tabIndex={0}
        {...dragListeners}
        {...dragAttributes}
        {...props}
      >
        {/* Screen */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-white dark:bg-gray-950">
          {/* Status Bar Area */}
          <div 
            className={cn(
              "absolute top-0 left-0 right-0 h-12 z-10 flex items-center justify-between px-8 pt-2 bg-white dark:bg-gray-950",
              isDragging && "cursor-grabbing"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-900 dark:text-white text-sm font-semibold">9:41</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-5 h-4 border border-gray-900 dark:border-white rounded-sm"
                aria-label="Battery level indicator"
                role="img"
              >
                <div className="w-3/4 h-full bg-gray-900 dark:bg-white rounded-sm" />
              </div>
              <svg 
                className="w-6 h-4 text-gray-900 dark:text-white" 
                fill="currentColor" 
                viewBox="0 0 24 12"
                aria-label="Signal strength indicator"
                role="img"
              >
                <path d="M1 6h22M1 6l4-4M1 6l4 4M23 6l-4-4M23 6l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div 
            data-content-area="true"
            className="w-full h-full pt-12 pb-4 overflow-auto"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {children}
          </div>

          {/* Home Indicator */}
          <div 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-gray-400 dark:bg-gray-600 rounded-full"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
);
