import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OperatorMain({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[min(100%,1600px)] p-5 md:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function OperatorPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}

export function OperatorPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card text-card-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

export function OperatorStatBlock({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <OperatorPanel className={cn("p-4 md:p-5", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground md:text-3xl">
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">{sub}</p>
      ) : null}
    </OperatorPanel>
  );
}
