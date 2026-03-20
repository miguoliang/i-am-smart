import { cn } from "@/lib/utils";

/** Matches the authenticated learn settings trigger (TopBar) for visual consistency. */
export const learnTopChromeButtonClassName = cn(
  "h-11 min-h-[44px] gap-2 rounded-xl px-3.5 shadow-md",
  "border-2 border-border/80 bg-card/95 text-foreground backdrop-blur-sm",
  "hover:bg-card hover:border-foreground/25 hover:shadow-lg",
  "font-medium text-sm"
);
