"use client";

import { useEffect } from "react";

interface UseLearnKeyboardShortcutsParams {
  enabled: boolean;
  /** True after user chose 不会/会了 and answer is shown; 下一个 is next action */
  waitingForNext: boolean;
  isReviewPending?: boolean;
  chooseForgot: () => void;
  chooseKnown: () => void;
  /** 按原先选的档位进入下一词 */
  submitNext: () => void;
  /** 记错了：按难度 1 进入下一词 */
  submitMisremembered: () => void;
  speak: () => void;
  /** 隐藏快捷键 W：标记词条有误（登录用户） */
  onReportKnowledgeError?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

/**
 * Desktop (pointer: fine): S 发音；先 A 不会 / D 会了（显示答案）；
 * 出示答案后 A 记错了（难度1）、D 下一个（按原选择）。
 * W：标记当前词条有误（需传入 onReportKnowledgeError）。
 */
export function useLearnKeyboardShortcuts({
  enabled,
  waitingForNext,
  isReviewPending = false,
  chooseForgot,
  chooseKnown,
  submitNext,
  submitMisremembered,
  speak,
  onReportKnowledgeError,
}: UseLearnKeyboardShortcutsParams): void {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat || isTypingTarget(e.target)) return;

      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (k === "s") {
        e.preventDefault();
        speak();
        return;
      }

      if (k === "w" && onReportKnowledgeError) {
        e.preventDefault();
        onReportKnowledgeError();
        return;
      }

      if (waitingForNext) {
        if (isReviewPending) return;
        if (k === "a") {
          e.preventDefault();
          submitMisremembered();
          return;
        }
        if (k === "d") {
          e.preventDefault();
          submitNext();
        }
        return;
      }

      if (k === "a") {
        e.preventDefault();
        chooseForgot();
        return;
      }

      if (k === "d") {
        e.preventDefault();
        chooseKnown();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    waitingForNext,
    isReviewPending,
    chooseForgot,
    chooseKnown,
    submitNext,
    submitMisremembered,
    speak,
    onReportKnowledgeError,
  ]);
}
