"use client";

import type { ReactNode } from "react";
import React from "react";
import { cn } from "@/lib/utils";
import type { WindowPosition } from "./types";

interface MacOSWindowProps {
  title?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: React.CSSProperties;
  defaultPosition?: WindowPosition;
  "data-dragging"?: boolean;
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
}

export const MacOSWindow = React.forwardRef<HTMLDivElement, MacOSWindowProps>(
  function MacOSWindow(
    {
      title = "Window",
      children,
      className,
      contentClassName,
      style,
      "data-dragging": isDragging,
      dragAttributes,
      dragListeners,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.48)] overflow-hidden border border-gray-200/50 dark:border-gray-700/50",
          className
        )}
        style={style}
      >
        {/* Title Bar - macOS Sequoia Style */}
        <div
          data-drag-handle
          {...dragListeners}
          {...dragAttributes}
          className={cn(
            "flex items-center justify-between px-4 h-11 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 rounded-t-2xl",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
        >
        {/* Traffic Light Buttons - macOS Sequoia Style (Monochrome, Non-interactive) */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600"
            aria-hidden="true"
          />
          <div
            className="w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600"
            aria-hidden="true"
          />
          <div
            className="w-3.5 h-3.5 rounded-full bg-gray-400 dark:bg-gray-600"
            aria-hidden="true"
          />
        </div>

        {/* Window Title - macOS Sequoia Style */}
        <div className="flex-1 text-center">
          <h2 className="text-[13px] font-medium text-gray-900 dark:text-gray-100 truncate px-4 tracking-tight">
            {title}
          </h2>
        </div>

        {/* Spacer to balance the layout */}
        <div className="w-[76px]" />
        </div>

        {/* Content Area */}
        <div
          className={cn(
            "flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-b-2xl",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    );
  }
);
