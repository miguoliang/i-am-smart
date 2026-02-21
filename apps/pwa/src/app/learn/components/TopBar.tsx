"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/form/Button";
import { LogOut, Settings, Bell, BellOff, Loader2, Check, Lock } from "lucide-react";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useProfile } from "@/hooks/useProfile";
import { updateProfile as updateProfileApi } from "@/lib/api/profiles";
import { AVAILABLE_LEVELS } from "@i-am-smart/shared/constants";
import type { Level } from "@i-am-smart/shared/constants";
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
import { DAILY_DUE_LIMIT_PRESETS } from "@/lib/constants";
import { parseApiErrorResponse } from "@/lib/utils/apiError";
import { ProfileSwitcher } from "./ProfileSwitcher";

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

interface DailyDueLimitPresetsProps {
  me: { username: string | null; daily_due_limit: number } | undefined;
  onSelect: (value: number) => void;
  isPending: boolean;
  pendingValue: number | undefined;
}

function DailyDueLimitPresets({ me, onSelect, isPending, pendingValue }: DailyDueLimitPresetsProps) {
  const currentLimit = me?.daily_due_limit;
  const effectiveLimit = pendingValue !== undefined ? pendingValue : currentLimit;

  return (
    <div className="space-y-2">
      <div
        className="flex gap-2"
        role="group"
        aria-labelledby="daily-due-limit-label"
        aria-describedby="daily-due-limit-desc"
      >
        <span id="daily-due-limit-label" className="sr-only">
          {t().settings.dailyDueLimitLabel}
        </span>
        {DAILY_DUE_LIMIT_PRESETS.map((value) => {
          const isSelected = effectiveLimit === value;
          const isUpdating = isPending && pendingValue === value;
          return (
            <Button
              key={value}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(value)}
              disabled={isPending}
              aria-pressed={isSelected}
              aria-busy={isUpdating}
              className="flex-1"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                value
              )}
            </Button>
          );
        })}
      </div>
      <p id="daily-due-limit-desc" className="text-xs text-muted-foreground">
        {t().settings.dailyDueLimitDescription}
      </p>
    </div>
  );
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfile, refetch: refetchProfiles } = useProfile();
  const level = activeProfile?.level ?? 'A1';

  const updateLevelMutation = useMutation({
    mutationFn: (newLevel: Level) => updateProfileApi(activeProfile!.id, { level: newLevel }),
    onSuccess: () => {
      refetchProfiles();
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

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

  const handleSelectDailyLimit = (n: number) => updateLimitMutation.mutate(n);

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
            {/* Profile Switcher */}
            <div className="mb-6">
              <ProfileSwitcher />
            </div>

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
                <DailyDueLimitPresets
                  me={me}
                  onSelect={handleSelectDailyLimit}
                  isPending={updateLimitMutation.isPending}
                  pendingValue={updateLimitMutation.variables}
                />
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                选择等级
              </h3>
              {AVAILABLE_LEVELS.map((levelOption) => {
                const isComingSoon = ["C1", "C2"].includes(levelOption);
                const isPro = ["B1", "B2"].includes(levelOption);
                
                return (
                  <button
                    key={levelOption}
                    disabled={isComingSoon || updateLevelMutation.isPending}
                    onClick={() => {
                      if (isPro) {
                        setOpen(false);
                        router.push("/pay");
                        return;
                      }
                      if (!isComingSoon && activeProfile) {
                        updateLevelMutation.mutate(levelOption);
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
