import { useSignOut } from "@/hooks/useSignOut";
import { useStats } from "@/app/stats/hooks/useStats";
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
import { ProfileSwitcher } from "./ProfileSwitcher";
import { NpsRating } from "./NpsRating";
import { InviteCard } from "./InviteCard";

const NPS_DISMISSED_KEY = "nps_dismissed_at";

export function EmptyState() {
  const { signOut, isSigningOut } = useSignOut();
  const stats = useStats();
  const [open, setOpen] = useState(false);
  const [showNps, setShowNps] = useState(false);

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
    <div className="min-h-dvh w-full bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 relative">
      {/* Settings */}
      <div
        className="absolute left-4 z-50"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-0 gap-0 max-h-[85dvh] rounded-t-2xl">
            <SheetHeader className="border-b p-6 text-left">
              <SheetTitle>设置</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <ProfileSwitcher />
            </div>
            <div className="border-t p-4 mt-auto">
              <button
                onClick={() => { setOpen(false); signOut(); }}
                disabled={isSigningOut}
                className="flex items-center gap-3 rounded-lg px-4 py-3 w-full text-left hover:bg-accent transition-colors disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
                <span>退出登录</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="text-center">
        <p className="text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300">
          今天够了，明天见 👋
        </p>
        {stats.total > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            已掌握 {stats.mastered} 词
          </p>
        )}
      </div>

      {/* NPS Rating */}
      {showNps && (
        <div className="mt-8 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
          <NpsRating onSubmit={handleNpsSubmit} onDismiss={handleNpsDismiss} />
        </div>
      )}

      {/* Invite */}
      {!showNps && (
        <div className="mt-8 w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4">
          <InviteCard />
        </div>
      )}
    </div>
  );
}
