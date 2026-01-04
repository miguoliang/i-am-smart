"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Bell, BellOff, Loader2, X } from "lucide-react";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
  const [open, setOpen] = useState(false);
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
      {/* Top Left Settings Button */}
      <div 
        className="absolute left-4 z-50"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Settings Drawer */}
      <>
        {/* Overlay */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/50 transition-opacity",
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={() => setOpen(false)}
        />
        {/* Drawer */}
        <div
          className={cn(
            "fixed left-0 top-0 z-50 h-full w-[300px] max-w-[85vw] bg-background border-r shadow-lg",
            "transform transition-transform duration-300 ease-in-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
            <div className="border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">设置</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">关闭</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-col p-4">
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
          </div>
      </>

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
