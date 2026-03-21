"use client";

import { useState } from "react";
import { Button } from "@/components/form/Button";

interface NpsRatingProps {
  onSubmit: (score: number, comment?: string) => void;
  onDismiss: () => void;
}

export function NpsRatingSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-busy="true"
      aria-label="加载推荐度问卷"
    >
      <div className="mx-auto h-4 w-[min(100%,18rem)] rounded-md bg-muted animate-pulse" />
      <div className="flex justify-center gap-1" aria-hidden>
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="h-8 w-8 shrink-0 rounded-lg bg-muted animate-pulse"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
      <div className="flex justify-between px-1" aria-hidden>
        <div className="h-3 w-14 rounded bg-muted animate-pulse" />
        <div className="h-3 w-14 rounded bg-muted animate-pulse" />
      </div>
      <div className="mx-auto h-3 w-16 rounded bg-muted animate-pulse" aria-hidden />
    </div>
  );
}

export function NpsRating({ onSubmit, onDismiss }: NpsRatingProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (score === null) return;
    onSubmit(score, comment || undefined);
    setSubmitted(true);
    setTimeout(onDismiss, 1500);
  };

  if (submitted) {
    return (
      <div className="text-center py-4">
        <p className="text-lg">感谢你的反馈 🙏</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-center text-muted-foreground">
        你有多大可能向朋友推荐这个工具？
      </p>

      {/* Score buttons 0-10 */}
      <div className="flex justify-center gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => setScore(i)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
              score === i
                ? i <= 6
                  ? "bg-red-500 text-white"
                  : i <= 8
                  ? "bg-yellow-500 text-white"
                  : "bg-green-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>完全不会</span>
        <span>非常愿意</span>
      </div>

      {score !== null && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="有什么建议？（可选）"
            className="w-full rounded-lg border p-2 text-sm resize-none h-16 bg-background"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onDismiss} className="flex-1">
              跳过
            </Button>
            <Button size="sm" onClick={handleSubmit} className="flex-1">
              提交
            </Button>
          </div>
        </>
      )}

      {score === null && (
        <button
          onClick={onDismiss}
          className="text-xs text-muted-foreground hover:underline w-full text-center"
        >
          下次再说
        </button>
      )}
    </div>
  );
}
