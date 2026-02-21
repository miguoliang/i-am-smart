"use client";

import { useRouter } from "next/navigation";

export function GuestEmptyState() {
  const router = useRouter();

  return (
    <div className="min-h-dvh w-full bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <p className="text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300 mb-6">
          体验结束 👋
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          注册后解锁全部词库，保留学习进度
        </p>
        <button
          onClick={() => router.push("/signin?next=/learn")}
          className="px-8 py-3 rounded-xl text-white bg-emerald-500 hover:bg-emerald-600 font-medium transition"
        >
          注册 / 登录
        </button>
      </div>
    </div>
  );
}
