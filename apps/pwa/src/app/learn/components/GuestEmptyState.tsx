"use client";

import { useRouter } from "next/navigation";

export function GuestEmptyState() {
  const router = useRouter();

  return (
    <div className="min-h-dvh w-full bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
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
      </div>
    </div>
  );
}
