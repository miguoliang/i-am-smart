"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "首页" },
  { href: "/features", label: "功能" },
  { href: "/docs", label: "文档" },
  { href: "/blog", label: "博客" },
  { href: "/about", label: "关于" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
            背它一辈子
          </Link>
          <div className="flex items-center gap-6">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/learn"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              开始学习
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
