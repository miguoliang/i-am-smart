import { useSignOut } from "@/hooks/useSignOut";
import { Settings, LogOut } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/overlay/Sheet";
import { Button } from "@/components/form/Button";
import { useProfile } from "@/hooks/useProfile";
import { learnTopChromeButtonClassName } from "./learnTopChromeStyles";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { NpsRating } from "./NpsRating";
import { InviteCard } from "./InviteCard";
import { LearnPageBackground } from "./LearnPageBackground";
import { getLevelLabelAndPalette } from "../lib/learnBackground";

const NPS_DISMISSED_KEY = "nps_dismissed_at";

export function EmptyState() {
  const { activeProfile } = useProfile();
  const { signOut, isSigningOut } = useSignOut();
  const [open, setOpen] = useState(false);
  const [showNps, setShowNps] = useState(false);
  const { levelLabel, paletteKey } = getLevelLabelAndPalette(
    activeProfile?.exam_target,
    activeProfile?.level
  );

  useEffect(() => {
    // Show NPS if not dismissed in last 30 days
    const dismissed = localStorage.getItem(NPS_DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < 30 * 24 * 60 * 60 * 1000) return;

    fetch("/api/nps")
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.canRate) setShowNps(true);
      })
      .catch(() => {});
  }, []);

  const handleNpsSubmit = useCallback((score: number, comment?: string) => {
    fetch("/api/nps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment }),
    }).catch(() => {});
    localStorage.setItem(NPS_DISMISSED_KEY, String(Date.now()));
  }, []);

  const handleNpsDismiss = useCallback(() => {
    setShowNps(false);
    localStorage.setItem(NPS_DISMISSED_KEY, String(Date.now()));
  }, []);

  return (
    <LearnPageBackground levelLabel={levelLabel} paletteKey={paletteKey}>
      <div className="relative flex w-full flex-col items-center justify-center">
        {/* Settings — same chrome as learn TopBar (fixed + labeled button) */}
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
                className={learnTopChromeButtonClassName}
                aria-label="打开设置"
              >
                <Settings className="h-5 w-5 shrink-0 text-foreground" aria-hidden />
                <span>设置</span>
              </Button>
            </div>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85dvh] gap-0 rounded-t-2xl p-0">
            <SheetHeader className="border-b p-6 text-left">
              <SheetTitle>设置</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <ProfileSwitcher />
            </div>
            <div className="mt-auto border-t p-4">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                disabled={isSigningOut}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-accent disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                <span>退出登录</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="text-center">
          <p className="text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300">
            今天够了，明天见 👋
          </p>
        </div>

        {/* NPS Rating */}
        {showNps && (
          <div className="mt-8 w-full max-w-sm rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800">
            <NpsRating onSubmit={handleNpsSubmit} onDismiss={handleNpsDismiss} />
          </div>
        )}

        {/* Invite */}
        {!showNps && (
          <div className="mt-8 w-full max-w-sm rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800">
            <InviteCard />
          </div>
        )}
      </div>
    </LearnPageBackground>
  );
}
