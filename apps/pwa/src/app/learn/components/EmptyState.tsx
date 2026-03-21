"use client";

import { Settings } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/overlay/Sheet";
import { Button } from "@/components/form/Button";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";
import { learnTopChromeButtonClassName } from "./learnTopChromeStyles";
import { LearnSettingsSheetContent } from "./LearnSettingsSheetContent";
import { NpsRating, NpsRatingSkeleton } from "./NpsRating";
import { InviteCard } from "./InviteCard";
import { LearnPageBackground } from "./LearnPageBackground";
import { getLevelLabelAndPalette } from "../lib/learnBackground";

const NPS_DISMISSED_KEY = "nps_dismissed_at";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type NpsSlot = "loading" | "nps" | "invite";

export interface LearnAuthActions {
  handleSignOut: () => void;
  isSigningOut: boolean;
}

interface EmptyStateProps {
  auth: LearnAuthActions;
}

export function EmptyState({ auth }: EmptyStateProps) {
  const { activeProfile } = useProfile();
  const { handleSignOut, isSigningOut } = auth;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sheetMaxH, setSheetMaxH] = useState("85dvh");
  const [npsSlot, setNpsSlot] = useState<NpsSlot>("loading");
  const { levelLabel, paletteKey } = getLevelLabelAndPalette(
    activeProfile?.exam_target,
    activeProfile?.level
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setSheetMaxH(`${vv.height * 0.85}px`);
    };
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem(NPS_DISMISSED_KEY);
    if (dismissed && Date.now() - Number(dismissed) < THIRTY_DAYS_MS) {
      queueMicrotask(() => setNpsSlot("invite"));
      return;
    }

    let cancelled = false;
    fetch("/api/nps")
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        setNpsSlot(res.data?.canRate ? "nps" : "invite");
      })
      .catch(() => {
        if (!cancelled) setNpsSlot("invite");
      });

    return () => {
      cancelled = true;
    };
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
    setNpsSlot("invite");
    localStorage.setItem(NPS_DISMISSED_KEY, String(Date.now()));
  }, []);

  return (
    <LearnPageBackground levelLabel={levelLabel} paletteKey={paletteKey}>
      <div className="relative flex w-full flex-col items-center justify-center">
        {/* Settings — same chrome as learn TopBar (fixed + labeled button) */}
        <Sheet
          open={open}
          onOpenChange={(next) => {
            if (isSigningOut && next) return;
            setOpen(next);
          }}
        >
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
                disabled={isSigningOut}
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
              "flex flex-col gap-0 border-x-0 border-b-0 p-0",
              "rounded-t-[1.35rem] border-t border-border/60 sm:rounded-t-2xl",
              "bg-background/92 backdrop-blur-md supports-backdrop-filter:bg-background/78",
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
            <LearnSettingsSheetContent
              onNavigateToPay={() => {
                setOpen(false);
                router.push("/pay");
              }}
              onSignOut={() => {
                setOpen(false);
                handleSignOut();
              }}
              isSigningOut={isSigningOut}
            />
          </SheetContent>
        </Sheet>

        <div className="text-center">
          <p className="text-2xl md:text-3xl font-medium text-gray-700 dark:text-gray-300">
            今天够了，明天见 👋
          </p>
        </div>

        {/* NPS (loading skeleton / form) or invite */}
        {npsSlot !== "invite" && (
          <div className="mt-8 w-full max-w-sm rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800">
            {npsSlot === "loading" ? (
              <NpsRatingSkeleton />
            ) : (
              <NpsRating onSubmit={handleNpsSubmit} onDismiss={handleNpsDismiss} />
            )}
          </div>
        )}

        {npsSlot === "invite" && (
          <div className="mt-8 w-full max-w-sm rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800">
            <InviteCard />
          </div>
        )}
      </div>
    </LearnPageBackground>
  );
}
