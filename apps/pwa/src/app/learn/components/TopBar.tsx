"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/form/Button";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/overlay/Sheet";
import { learnTopChromeButtonClassName } from "./learnTopChromeStyles";
import { LearnSettingsSheetContent } from "./LearnSettingsSheetContent";

interface TopBarProps {
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
  const [open, setOpen] = useState(false);
  const [sheetMaxH, setSheetMaxH] = useState("85dvh");
  const router = useRouter();

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      setSheetMaxH(`${vv.height * 0.85}px`);
    };
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  const handleSignOut = () => {
    setOpen(false);
    onSignOut();
  };

  return (
    <>
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
            onSignOut={handleSignOut}
            isSigningOut={isSigningOut}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
