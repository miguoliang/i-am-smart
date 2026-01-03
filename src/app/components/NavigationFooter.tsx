"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NavigationFooter = () => {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around items-center py-4">
        <Link
          href="/learn"
          className={`text-2xl transition-colors ${
            pathname === "/learn"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          学习
        </Link>
        <Link
          href="/stats"
          className={`text-2xl transition-colors ${
            pathname === "/stats"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          统计
        </Link>
        <Link
          href="/feedback"
          className={`text-2xl transition-colors ${
            pathname === "/feedback"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          反馈
        </Link>
      </div>
    </footer>
  );
};

