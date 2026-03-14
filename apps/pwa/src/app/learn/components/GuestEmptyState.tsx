"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { LearnPageBackground } from "./LearnPageBackground";

export function GuestEmptyState() {
  const router = useRouter();

  return (
    <LearnPageBackground>
      {/* Back to home */}
      <div
        className="absolute left-4 z-50"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="返回首页"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>首页</span>
        </Link>
      </div>

      <div className="text-center">
        <p className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-3">
          20 个词 ✓
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          词库里还有 3000+ 个词等你，注册免费，30 秒搞定
        </p>
        <button
          onClick={() => router.push("/signin?next=/learn")}
          className="px-8 py-3 rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 font-medium transition"
        >
          开始记住它们
        </button>
        <br />
        <button
          onClick={() => {
            // Clear guest learn data and restart
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
          className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          再试一次
        </button>
      </div>
    </LearnPageBackground>
  );
}
