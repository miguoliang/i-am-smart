import Link from "next/link";
import { cn } from "@/lib/utils";

export function SkipLink() {
  return (
    <Link
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50",
        "px-4 py-2 bg-background text-foreground border rounded-md shadow-lg font-medium",
        "outline-none ring-2 ring-ring ring-offset-2"
      )}
    >
      跳过导航，进入主要内容
    </Link>
  );
}
