"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NavigationFooter = () => {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="grid grid-cols-4 gap-1 items-center py-3 px-1">
        <Link
          href="/learn"
          className={`text-center text-lg sm:text-xl transition-colors ${
            pathname === "/learn"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          学习
        </Link>
        <Link
          href="/stats"
          className={`text-center text-lg sm:text-xl transition-colors ${
            pathname === "/stats"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          统计
        </Link>
        <Link
          href="/feedback"
          className={`text-center text-lg sm:text-xl transition-colors ${
            pathname === "/feedback"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          反馈
        </Link>
        <Link
          href="/contact"
          className={`text-center text-lg sm:text-xl transition-colors ${
            pathname === "/contact"
              ? "font-bold text-primary"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          联系
        </Link>
      </div>
    </footer>
  );
};

