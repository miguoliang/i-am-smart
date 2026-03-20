"use client";

import { cn } from "@/lib/utils";

interface ExamVocabProgressBarProps {
  brushed: number;
  total: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Compact vocab progress: `x/y` only (no track bar — avoids a full-width “white line” next to numbers).
 */
export function ExamVocabProgressBar({
  brushed,
  total,
  isLoading,
  className,
}: ExamVocabProgressBarProps) {
  if (isLoading) {
    return (
      <span
        className={cn(
          "inline-block h-3 w-12 shrink-0 animate-pulse rounded bg-muted/80 align-middle",
          className
        )}
        aria-hidden
      />
    );
  }

  const safeTotal = Math.max(0, total);
  const safeBrushed = Math.max(0, brushed);

  return (
    <span
      className={cn(
        "shrink-0 text-xs leading-none tabular-nums text-muted-foreground whitespace-nowrap",
        className
      )}
      aria-label={`已刷 ${safeBrushed}，共 ${safeTotal} 词`}
    >
      {safeBrushed}/{safeTotal}
    </span>
  );
}
