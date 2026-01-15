"use client";

import type { ReactNode } from "react";
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { WindowPosition } from "./types";

interface IPhoneFrameProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "style" | "className"> {
  children: ReactNode;
  className?: string;
  variant?: "light" | "dark";
  defaultPosition?: WindowPosition;
  scale?: number;
  style?: React.CSSProperties;
  "data-dragging"?: boolean;
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
}

export const IPhoneFrame = React.forwardRef<HTMLDivElement, IPhoneFrameProps>(
  function IPhoneFrame(
    {
      children,
      className,
      variant = "light",
      scale = 1,
      style,
      "data-dragging": isDragging,
      dragAttributes,
      dragListeners,
      ...props
    },
    ref
  ) {
    const scaledStyle = useMemo(() => {
      const baseStyle: React.CSSProperties = { ...style };

      // Merge transform with existing transform (e.g. from drag)
      // Apply scale last to ensure translation happens in unscaled coordinates
      // Only add scale transform if it's not 1 (to avoid hydration mismatch)
      if (scale !== 1) {
        const existingTransform = baseStyle.transform ? `${baseStyle.transform} ` : "";
        baseStyle.transform = `${existingTransform}scale(${scale})`;
        baseStyle.transformOrigin = "top left";
      }

      return baseStyle;
    }, [scale, style]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative mx-auto w-[375px] h-[812px] rounded-[3.5rem] p-2 cursor-grab active:cursor-grabbing",
          variant === "light"
            ? "bg-gray-900 shadow-2xl"
            : "bg-black shadow-2xl",
          isDragging && "cursor-grabbing",
          className
        )}
        style={scaledStyle}
        role="application"
        aria-label="iPhone frame"
        tabIndex={0}
        {...dragListeners}
        {...dragAttributes}
        {...props}
      >
      {/* Screen */}
      <div className="relative w-full h-full rounded-[3rem] overflow-hidden bg-white dark:bg-gray-950">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[134px] h-[30px] bg-gray-900 dark:bg-black rounded-b-3xl z-10" />

        {/* Status Bar Area */}
        <div className="absolute top-0 left-0 right-0 h-12 z-10 flex items-center justify-between px-6 pt-1">
          <div className="flex items-center gap-1">
            <span className="text-white text-xs font-semibold">9:41</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 border border-white rounded-sm">
              <div className="w-full h-full bg-white rounded-sm" style={{ width: "75%" }} />
            </div>
            <svg className="w-5 h-3 text-white" fill="currentColor" viewBox="0 0 24 12">
              <path d="M1 6h22M1 6l4-4M1 6l4 4M23 6l-4-4M23 6l-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="w-full h-full pt-12 pb-8 overflow-auto">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-gray-400 dark:bg-gray-600 rounded-full" />
      </div>
    </div>
    );
  }
);
