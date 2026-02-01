"use client";

import { useState } from "react";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Label } from "@/components/form/Label";
import { LogOut, Settings, Bell, BellOff, Loader2, Check, Lock } from "lucide-react";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useLevel } from "../hooks/useLevel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/overlay/Sheet";
import { t } from "@/lib/i18n";
import { MIN_DAILY_DUE_LIMIT, MAX_DAILY_DUE_LIMIT } from "@/lib/constants";
import { parseApiErrorResponse } from "@/lib/utils/apiError";

interface TopBarProps {
  onSignOut: () => void;
  isSigningOut: boolean;
}

async function fetchMe() {
  const res = await fetch("/api/accounts/me");
  if (!res.ok) throw new Error(await parseApiErrorResponse(res, t().settings.loadFailed));
  const { data } = await res.json();
  return data as { username: string | null; daily_due_limit: number };
}

async function updateDailyDueLimit(value: number) {
  const res = await fetch("/api/accounts/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ daily_due_limit: value }),
  });
  if (!res.ok) throw new Error(await parseApiErrorResponse(res, t().settings.updateFailed));
  const { data } = await res.json();
  return data as { daily_due_limit: number };
}

interface DailyDueLimitFieldProps {
  me: { username: string | null; daily_due_limit: number } | undefined;
  onSave: (n: number) => void;
  isPending: boolean;
}

function DailyDueLimitField({ me, onSave, isPending }: DailyDueLimitFieldProps) {
  const [dailyDueInput, setDailyDueInput] = useState<string>(
    () => (me?.daily_due_limit != null ? String(me.daily_due_limit) : "")
  );

  const handleSave = () => {
    const n = parseInt(dailyDueInput, 10);
    if (!Number.isInteger(n) || n < MIN_DAILY_DUE_LIMIT || n > MAX_DAILY_DUE_LIMIT) {
      toast.error(t().settings.dailyDueLimitRange);
      return;
    }
    onSave(n);
  };

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <Label htmlFor="daily-due-limit" className="sr-only">
          {t().settings.dailyDueLimitDescription}
        </Label>
        <Input
          id="daily-due-limit"
          type="number"
          min={MIN_DAILY_DUE_LIMIT}
          max={MAX_DAILY_DUE_LIMIT}
          value={dailyDueInput}
          onChange={(e) => setDailyDueInput(e.target.value)}
          aria-describedby="daily-due-limit-desc"
          disabled={isPending}
          className="h-10"
        />
        <p id="daily-due-limit-desc" className="text-xs text-muted-foreground mt-1">
          {t().settings.dailyDueLimitDescription}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={handleSave}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          t().settings.save
        )}
      </Button>
    </div>
  );
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { level, setLevel, availableLevels } = useLevel();
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ["accounts", "me"],
    queryFn: fetchMe,
    enabled: open,
  });

  const updateLimitMutation = useMutation({
    mutationFn: updateDailyDueLimit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "me"] });
      queryClient.invalidateQueries({ queryKey: ["cards", "due"] });
      toast.success(t().settings.saved);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t().common.error),
  });

  const handleSaveDailyLimit = (n: number) => updateLimitMutation.mutate(n);

  const {
    isSupported: isPushSupported,
    subscription,
    loading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
  } = usePushNotifications();

  const handlePushToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (subscription) unsubscribePush();
    else subscribePush();
  };

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {/* Top Left Settings Button */}
          <div
            className="absolute left-4 z-50"
            style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
          >
            <Button variant="ghost" size="icon">
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </SheetTrigger>

        {/* Settings Drawer */}
        <SheetContent side="left" className="flex flex-col h-full p-0 gap-0 w-[300px] sm:w-[300px]">
          {/* Header */}
          <SheetHeader className="border-b p-6 text-left">
            <SheetTitle>设置</SheetTitle>
          </SheetHeader>

          {/* Level List & Daily Limit */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Daily due limit */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t().settings.dailyDueLimitLabel}
              </h3>
              {meLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t().common.loading}
                </div>
              ) : (
                <DailyDueLimitField
                  key={me?.daily_due_limit ?? "loading"}
                  me={me}
                  onSave={handleSaveDailyLimit}
                  isPending={updateLimitMutation.isPending}
                />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                选择等级
              </h3>
              {availableLevels.map((levelOption) => {
                const isComingSoon = ["C1", "C2"].includes(levelOption);
                const isPro = ["B1", "B2"].includes(levelOption);
                
                return (
                  <button
                    key={levelOption}
                    disabled={isComingSoon}
                    onClick={() => {
                      if (isPro) {
                        toast.info("升级会员解锁该等级");
                        return;
                      }
                      if (!isComingSoon) {
                        setLevel(levelOption);
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                      isComingSoon
                        ? "opacity-50 cursor-not-allowed bg-muted/50"
                        : "hover:bg-accent hover:text-accent-foreground",
                      level === levelOption && !isComingSoon && !isPro && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="flex items-center justify-center w-5 h-5">
                      {level === levelOption && <Check className="h-4 w-4" />}
                      {isPro && <Lock className="h-4 w-4 text-amber-500" />}
                    </div>
                    <span className="flex-1">{levelOption}</span>
                    {isPro && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 px-2 py-0.5 rounded whitespace-nowrap">
                        Pro
                      </span>
                    )}
                    {isComingSoon && (
                      <span className="text-xs bg-muted-foreground/20 px-2 py-0.5 rounded text-muted-foreground whitespace-nowrap">
                        敬请期待
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="border-t p-4 flex flex-col gap-2 flex-shrink-0">
            {isPushSupported && (
              <button
                onClick={handlePushToggle}
                disabled={pushLoading}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {pushLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : subscription ? (
                  <Bell className="h-5 w-5" />
                ) : (
                  <BellOff className="h-5 w-5" />
                )}
                <span>{subscription ? "关闭提醒" : "开启提醒"}</span>
              </button>
            )}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              {isSigningOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <LogOut className="h-5 w-5" />
              )}
              <span>退出登录</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Top Right Install Button */}
      <div
        className="absolute right-4 z-50"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <InstallPrompt />
      </div>
    </>
  );
}
