"use client";

import Link from "next/link";
import { Button } from "@/components/form/Button";
import { useAuth } from "../hooks/useAuth";

export function NavigationAuthButtons() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // Loading state - show placeholder to prevent layout shift
    return <div className="w-[100px] md:w-[120px]"></div>;
  }

  if (isAuthenticated) {
    // User is logged in - show "开始学习" button
    return (
      <Button size="sm" className="text-xs md:text-sm" asChild>
        <Link href="/learn">开始学习</Link>
      </Button>
    );
  }

  // User is not logged in - show "登录" and "注册" buttons
  // Note: Since signin page handles both login and registration via OTP,
  // both buttons go to /signin
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Button variant="ghost" size="sm" className="text-xs md:text-sm" asChild>
        <Link href="/signin">登录</Link>
      </Button>
      <Button size="sm" className="text-xs md:text-sm" asChild>
        <Link href="/signin">注册</Link>
      </Button>
    </div>
  );
}
