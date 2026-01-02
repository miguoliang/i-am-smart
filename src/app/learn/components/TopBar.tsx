"use client";

import { Button } from "@/components/ui/button";
import { LogOut, Menu, Bell, BellOff, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InstallPrompt } from "@/app/components/InstallPrompt";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface TopBarProps {
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function TopBar({ onSignOut, isSigningOut }: TopBarProps) {
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

  return (
    <>
      {/* Top Left Burger Menu */}
      <div 
        className="absolute left-4 z-50"
        style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {isPushSupported && (
              <DropdownMenuItem
                onClick={handlePushToggle}
                disabled={pushLoading}
              >
                {pushLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : subscription ? (
                  <Bell className="mr-2 h-4 w-4" />
                ) : (
                  <BellOff className="mr-2 h-4 w-4" />
                )}
                <span>{subscription ? "关闭提醒" : "开启提醒"}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onSignOut} disabled={isSigningOut}>
              {isSigningOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
