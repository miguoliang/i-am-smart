"use client";

import { useRouter } from "next/navigation";

interface SignupPromptProps {
  onDismiss: () => void;
  reviewedCount: number;
}

export function SignupPrompt({ onDismiss, reviewedCount }: SignupPromptProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          刚才的 {reviewedCount} 个词，明天还记得吗？
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          注册后，我们会在你快忘的时候提醒你复习
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition"
          >
            先不了
          </button>
          <button
            onClick={() => router.push("/signin?next=/learn")}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 transition"
          >
            开始记住它们
          </button>
        </div>
      </div>
    </div>
  );
}
