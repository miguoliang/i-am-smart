"use client";

import Link from "next/link";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { NavigationAuthButtons } from "./NavigationAuthButtons";
import { useIsPreviewHost } from "@/lib/runtimeDeploymentClient";

export function Navigation() {
  const showPreviewBadge = useIsPreviewHost();
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo on the left */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity inline-flex items-center gap-1.5"
          >
            聪明的背单词工具
            {showPreviewBadge && (
              <span
                className="rounded bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white"
                aria-label="Preview environment"
              >
                Preview
              </span>
            )}
          </Link>

          {/* Right side - Install (PWA) + Auth buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <InstallPrompt />
            <NavigationAuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}
