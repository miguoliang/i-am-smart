"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/form/Button";
import { LogOut, Settings, Check, Lock } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { updateProfile as updateProfileApi } from "@/lib/api/profiles";
import {
  EXAM_PICKER_ENTRIES,
  type ExamTargetId,
} from "@i-am-smart/shared/constants";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/overlay/Sheet";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { ExamVocabProgressBar } from "./ExamVocabProgressBar";
import { useSubscription } from "@/hooks/useSubscription";
import { useExamVocabProgress } from "../hooks/useExamVocabProgress";

interface TopBarProps {
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [sheetMaxH, setSheetMaxH] = useState("85dvh");
  const [pendingExamId, setPendingExamId] = useState<string | null>(null);
  const [successExamId, setSuccessExamId] = useState<string | null>(null);
  const router = useRouter();

  // Track iOS visual viewport to avoid keyboard obscuring the sheet
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setSheetMaxH(`${vv.height * 0.85}px`);
    };
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);
  const queryClient = useQueryClient();
  const { activeProfile } = useProfile();
  const currentExamTarget = activeProfile?.exam_target ?? "ket";
  const { isPro } = useSubscription();
  const examVocabProgress = useExamVocabProgress(activeProfile?.id);

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

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <div
            className="fixed left-3 z-60 sm:left-4"
            style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-11 min-h-[44px] gap-2 rounded-xl px-3.5 shadow-md",
                "border-2 border-border/80 bg-card/95 text-foreground backdrop-blur-sm",
                "hover:bg-card hover:border-foreground/25 hover:shadow-lg",
                "font-medium text-sm"
              )}
              aria-label="打开设置"
            >
              <Settings className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
              <span>设置</span>
            </Button>
          </div>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          overlayClassName={cn(
            "bg-stone-900/35 dark:bg-black/45 backdrop-blur-[2px]",
            "data-[state=open]:duration-500 data-[state=closed]:duration-280"
          )}
          className={cn(
            "flex flex-col p-0 gap-0 rounded-t-[1.35rem] sm:rounded-t-2xl border-x-0 border-b-0",
            "border-t border-border/60 bg-background/92 backdrop-blur-md supports-backdrop-filter:bg-background/78",
            "shadow-[0_-12px_40px_-10px_rgba(0,0,0,0.14)] dark:shadow-[0_-12px_48px_-12px_rgba(0,0,0,0.5)]",
            "data-[state=open]:duration-500 data-[state=closed]:duration-300",
            "data-[state=open]:ease-[cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:ease-in",
            "pb-[max(1rem,env(safe-area-inset-bottom))]"
          )}
          style={{ maxHeight: sheetMaxH }}
        >
          <SheetHeader className="border-b border-border/50 p-6 text-left">
            <SheetTitle>设置</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Profile Switcher */}
            <div className="mb-6">
              <ProfileSwitcher />
            </div>

            {/* Exam target: merged labels (e.g. PET/四级) */}
            <div className="mb-6 space-y-2">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">选择考试目标</h3>
              {EXAM_PICKER_ENTRIES.map((entry) => {
                const isSelected = entry.examTargetIds.includes(
                  currentExamTarget as ExamTargetId
                );
                const stats = progressByExamId.get(entry.canonicalExamTargetId);
                const brushedTotal = stats?.brushed ?? 0;
                const wordsTotal = stats?.total ?? 0;
                const canonical = entry.canonicalExamTargetId;
                const showSuccess =
                  successExamId != null &&
                  entry.examTargetIds.includes(successExamId as ExamTargetId);
                return (
                  <button
                    key={entry.scopeKey}
                    type="button"
                    disabled={updateExamMutation.isPending}
                    onClick={() => {
                      if (entry.requiresPro && !isPro) {
                        setOpen(false);
                        router.push("/pay");
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
                          <Check className="h-4 w-4 text-emerald-500" />
                        )}
                        {pendingExamId !== canonical && !showSuccess && isSelected && (
                          <Check className="h-4 w-4" />
                        )}
                        {pendingExamId !== canonical &&
                          !showSuccess &&
                          !isSelected &&
                          entry.requiresPro &&
                          !isPro && <Lock className="h-4 w-4 text-amber-500" />}
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

          {/* Bottom: Sign out */}
          <div className="border-t p-4">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center gap-3 rounded-lg px-4 py-3 w-full text-left hover:bg-accent transition-colors disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" />
              <span>退出登录</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
