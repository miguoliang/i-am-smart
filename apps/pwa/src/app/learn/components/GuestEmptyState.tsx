"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/form/Button";
import { LearnPageBackground } from "./LearnPageBackground";
import { learnTopChromeButtonClassName } from "./learnTopChromeStyles";

export function GuestEmptyState() {
  const router = useRouter();

  return (
    <LearnPageBackground>
      {/* Back to home */}
      <div
        className="fixed left-3 z-50 sm:left-4"
        style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={learnTopChromeButtonClassName}
          asChild
        >
          <Link href="/" aria-label="返回首页">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span>首页</span>
          </Link>
        </Button>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          20 个词 ✓
        </p>
        <p className="mt-3 text-sm text-muted-foreground md:text-base">
          词库里还有 3000+ 个词等你，注册免费，30 秒搞定
        </p>
        <Button
          type="button"
          className="mt-8 w-full rounded-xl py-6 text-base font-medium"
          onClick={() => router.push("/signin?next=/learn")}
        >
          开始记住它们
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith("guest")) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((k) => localStorage.removeItem(k));
            router.push("/learn");
            router.refresh();
          }}
        >
          再试一次
        </Button>
      </div>
    </LearnPageBackground>
  );
}
