"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Lock, LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  EXAM_PICKER_ENTRIES,
  type ExamTargetId,
} from "@i-am-smart/shared/constants";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { updateProfile as updateProfileApi } from "@/lib/api/profiles";
import { useSubscription } from "@/hooks/useSubscription";
import { useExamVocabProgress } from "../hooks/useExamVocabProgress";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { ExamVocabProgressBar } from "./ExamVocabProgressBar";

export interface LearnSettingsSheetContentProps {
  /** Close sheet then route to pay (e.g. Pro-only exam). */
  onNavigateToPay: () => void;
  /** Close sheet and sign out (parent handles sheet `open` state). */
  onSignOut: () => void;
  isSigningOut: boolean;
}

/**
 * Shared settings body: profile switcher, exam target / 词库 picker, sign out.
 * Used by learn TopBar and EmptyState so behavior stays identical.
 */
export function LearnSettingsSheetContent({
  onNavigateToPay,
  onSignOut,
  isSigningOut,
}: LearnSettingsSheetContentProps) {
  const queryClient = useQueryClient();
  const { activeProfile } = useProfile();
  const currentExamTarget = activeProfile?.exam_target ?? "ket";
  const { isPro } = useSubscription();
  const examVocabProgress = useExamVocabProgress(activeProfile?.id);
  const [pendingExamId, setPendingExamId] = useState<string | null>(null);
  const [successExamId, setSuccessExamId] = useState<string | null>(null);

  const progressByExamId = useMemo(() => {
    const list = examVocabProgress.data;
    if (!list) {
      return new Map<string, { brushed: number; total: number }>();
    }
    return new Map(list.map((p) => [p.examId, { brushed: p.brushed, total: p.total }]));
  }, [examVocabProgress.data]);

  const updateExamMutation = useMutation({
    mutationFn: (examId: string) => updateProfileApi(activeProfile!.id, { exam_target: examId }),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData<import("@/lib/api/profiles").LearnerProfile[]>(
        ["profiles"],
        (old) => old?.map((p) => (p.id === updatedProfile.id ? updatedProfile : p)) ?? old
      );
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["exam-vocab-progress"] });
      setSuccessExamId(updatedProfile.exam_target ?? null);
      setPendingExamId(null);
      setTimeout(() => setSuccessExamId(null), 1500);
    },
    onError: () => {
      setPendingExamId(null);
    },
  });

  return (
    <>
      <div
        className={cn(
          "flex-1 overflow-y-auto p-4",
          isSigningOut && "pointer-events-none select-none opacity-60"
        )}
      >
        <div className="mb-6">
          <ProfileSwitcher />
        </div>

        <div className="mb-6 space-y-2">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">选择考试目标</h3>
          {EXAM_PICKER_ENTRIES.map((entry) => {
            const isSelected = entry.examTargetIds.includes(currentExamTarget as ExamTargetId);
            const stats = progressByExamId.get(entry.canonicalExamTargetId);
            const brushedTotal = stats?.brushed ?? 0;
            const wordsTotal = stats?.total ?? 0;
            const canonical = entry.canonicalExamTargetId;
            const showSuccess =
              successExamId != null && entry.examTargetIds.includes(successExamId as ExamTargetId);
            return (
              <button
                key={entry.scopeKey}
                type="button"
                disabled={updateExamMutation.isPending || isSigningOut}
                onClick={() => {
                  if (entry.requiresPro && !isPro) {
                    onNavigateToPay();
                    return;
                  }
                  if (!activeProfile || isSelected) return;
                  setPendingExamId(canonical);
                  updateExamMutation.mutate(canonical);
                }}
                className={cn(
                  "w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors",
                  "hover:bg-accent",
                  isSelected && "bg-accent text-accent-foreground"
                )}
              >
                <div className="flex w-full items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {pendingExamId === canonical && (
                      <svg
                        className="h-4 w-4 animate-spin text-indigo-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    )}
                    {pendingExamId !== canonical && showSuccess && (
                      <Check className="h-4 w-4 text-emerald-500" aria-hidden />
                    )}
                    {pendingExamId !== canonical && !showSuccess && isSelected && (
                      <Check className="h-4 w-4" aria-hidden />
                    )}
                    {pendingExamId !== canonical &&
                      !showSuccess &&
                      !isSelected &&
                      entry.requiresPro &&
                      !isPro && <Lock className="h-4 w-4 text-amber-500" aria-hidden />}
                  </div>
                  <span className="min-w-0 flex-1 font-medium">{entry.label}</span>
                  <ExamVocabProgressBar
                    brushed={brushedTotal}
                    total={wordsTotal}
                    isLoading={examVocabProgress.isLoading}
                  />
                  {entry.requiresPro && !isPro && (
                    <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">
                      Pro
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("border-t p-4", isSigningOut && "pointer-events-none select-none")}>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-accent disabled:opacity-100"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
              <span>正在退出…</span>
            </>
          ) : (
            <>
              <LogOut className="h-5 w-5 shrink-0" aria-hidden />
              <span>退出登录</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
