import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Section title for operator dashboard / SaaS pages (uppercase muted label). */
export function OperatorSectionLabel({
  id,
  children,
  className,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}

/** Dashboard section: executive-facing title + one-line “what to read here”. */
export function OperatorDashboardSectionHeader({
  id,
  title,
  subtitle,
  className,
}: {
  id: string;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-3", className)}>
      <h2
        id={id}
        className="text-sm font-semibold tracking-tight text-foreground"
      >
        {title}
      </h2>
      <p
        className="mt-1 text-xs leading-relaxed text-muted-foreground"
        id={`${id}-desc`}
      >
        {subtitle}
      </p>
    </header>
  );
}

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
        "mx-auto w-full max-w-[min(100%,1600px)] px-4 py-4 md:px-6 md:py-6",
        className
      )}
    >
      {children}
    </div>
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
  labelHint,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  /** Shown on hover over the metric title (native tooltip). */
  labelHint?: string;
  className?: string;
}) {
  return (
    <OperatorPanel className={cn("p-4 md:p-5", className)}>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wide text-muted-foreground",
          labelHint && "cursor-help"
        )}
        title={labelHint}
      >
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
