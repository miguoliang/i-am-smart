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

  // User is not logged in - show "立即使用" button
  return (
    <Button size="sm" className="text-xs md:text-sm" asChild>
      <Link href="/signin">立即使用</Link>
    </Button>
  );
}
