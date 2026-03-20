"use client";

interface ExamVocabProgressBarProps {
  levelsLabel: string;
  brushed: number;
  total: number;
  isLoading?: boolean;
}

export function ExamVocabProgressBar({
  levelsLabel,
  brushed,
  total,
  isLoading,
}: ExamVocabProgressBarProps) {
  if (isLoading) {
    return (
      <div className="mt-1.5 flex w-full items-center gap-2" aria-hidden>
        <div className="h-1.5 min-w-0 flex-1 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-28 shrink-0 animate-pulse rounded bg-muted/80" />
      </div>
    );
  }

  const safeTotal = Math.max(0, total);
  const safeBrushed = Math.max(0, brushed);
  const pct =
    safeTotal > 0 ? Math.min(100, Math.round((Math.min(safeBrushed, safeTotal) / safeTotal) * 100)) : 0;

  return (
    <div className="mt-1.5 flex w-full items-center gap-2">
      <div className="min-w-0 flex-1">
        <div
          role="progressbar"
          aria-valuenow={safeBrushed}
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-label={`${levelsLabel}，已刷 ${safeBrushed}，共 ${safeTotal} 词`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="shrink-0 text-right text-xs leading-none tabular-nums text-muted-foreground">
        <span className="whitespace-nowrap">{levelsLabel}</span>
        <span className="mx-1.5 text-border" aria-hidden>
          ·
        </span>
        <span className="whitespace-nowrap">
          已刷 {safeBrushed}/{safeTotal}
        </span>
      </p>
    </div>
  );
}
