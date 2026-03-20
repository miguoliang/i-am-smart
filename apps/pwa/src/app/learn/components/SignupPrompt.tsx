"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/form/Button";

interface SignupPromptProps {
  onDismiss: () => void;
  reviewedCount: number;
}

export function SignupPrompt({ onDismiss, reviewedCount }: SignupPromptProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/35 p-4 backdrop-blur-[2px] dark:bg-black/45">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xl">
        <p className="mb-2 text-lg font-medium">
          刚才的 {reviewedCount} 个词，明天还记得吗？
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          注册后，我们会在你快忘的时候提醒你复习
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onDismiss}
          >
            先不了
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-xl"
            onClick={() => router.push("/signin?next=/learn")}
          >
            开始记住它们
          </Button>
        </div>
      </div>
    </div>
  );
}
