"use client";

import { Loader2 } from "lucide-react";

/**
 * Blocks the viewport while sign-out is in progress to prevent mis-taps and duplicate actions.
 */
export function SignOutLockOverlay() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="正在退出登录，请稍候"
    >
      <Loader2 className="h-10 w-10 shrink-0 animate-spin text-primary" aria-hidden />
      <div className="max-w-xs px-6 text-center">
        <p className="text-base font-medium text-foreground">正在退出登录</p>
        <p className="mt-1 text-sm text-muted-foreground">请稍候，请勿重复点击</p>
      </div>
    </div>
  );
}
