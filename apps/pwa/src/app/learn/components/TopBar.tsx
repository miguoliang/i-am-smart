"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/form/Button";
import { LogOut, Settings, Check, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { useProfile } from "@/hooks/useProfile";
import { updateProfile as updateProfileApi } from "@/lib/api/profiles";
import { AVAILABLE_LEVELS } from "@i-am-smart/shared/constants";
import type { Level } from "@i-am-smart/shared/constants";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/overlay/Sheet";
import { parseApiErrorResponse } from "@/lib/utils/apiError";
import { t } from "@/lib/i18n";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { CalendarReminder } from "./CalendarReminder";
import { useStats } from "@/app/stats/hooks/useStats";

interface TopBarProps {
  onSignOut: () => void;
  isSigningOut: boolean;
}

async function fetchMe() {
  const res = await fetch("/api/accounts/me");
  if (!res.ok) throw new Error(await parseApiErrorResponse(res, t().settings.loadFailed));
  const { data } = await res.json();
  return data as { username: string | null; daily_due_limit: number; calendar_token: string | null; calendar_remind_hour: number };
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfile, refetch: refetchProfiles } = useProfile();
  const level = activeProfile?.level ?? 'A1';
  const stats = useStats();

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
    enabled: open && showMore,
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
            className="absolute left-4 z-50"
            style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
          >
            <Button variant="ghost" size="icon">
              <Settings className="h-6 w-6" />
            </Button>
          </div>
        </SheetTrigger>

        <SheetContent side="left" className="flex flex-col h-full p-0 gap-0 w-[280px] sm:w-[280px]">
          <SheetHeader className="border-b p-6 text-left">
            <SheetTitle>设置</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Profile Switcher */}
            <div className="mb-6">
              <ProfileSwitcher />
            </div>

            {/* Level Selector */}
            <div className="space-y-2 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">选择等级</h3>
              {AVAILABLE_LEVELS.map((levelOption) => {
                const isComingSoon = ["C1", "C2"].includes(levelOption);
                const isPro = ["B1", "B2"].includes(levelOption);
                return (
                  <button
                    key={levelOption}
                    disabled={isComingSoon || updateLevelMutation.isPending}
                    onClick={() => {
                      if (isPro) { setOpen(false); router.push("/pay"); return; }
                      if (!isComingSoon && activeProfile) {
                        updateLevelMutation.mutate(levelOption);
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors",
                      isComingSoon ? "opacity-50 cursor-not-allowed" : "hover:bg-accent",
                      level === levelOption && !isComingSoon && !isPro && "bg-accent text-accent-foreground"
                    )}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {level === levelOption && <Check className="h-4 w-4" />}
                      {isPro && <Lock className="h-4 w-4 text-amber-500" />}
                    </div>
                    <span className="flex-1">{levelOption}</span>
                    {isPro && <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 px-2 py-0.5 rounded">Pro</span>}
                    {isComingSoon && <span className="text-xs text-muted-foreground">敬请期待</span>}
                  </button>
                );
              })}
            </div>

            {/* Mastered count */}
            {stats.total > 0 && (
              <div className="mb-6 px-4 py-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">已掌握 <span className="font-medium text-foreground">{stats.mastered}</span> / {stats.total} 词</p>
              </div>
            )}

            {/* More settings (collapsed by default) */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
            >
              {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              更多设置
            </button>

            {showMore && (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-200">
                {/* Calendar Reminder */}
                <CalendarReminder
                  calendarToken={me?.calendar_token ?? null}
                  calendarRemindHour={me?.calendar_remind_hour ?? 9}
                  isLoading={meLoading}
                />
              </div>
            )}
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
