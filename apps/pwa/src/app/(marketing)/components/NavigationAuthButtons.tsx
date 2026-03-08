"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/form/Button";
import { useAuth } from "../hooks/useAuth";

export function NavigationAuthButtons() {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const isPayPage = pathname === "/pay";

  if (loading) {
    return <div className="w-[100px] md:w-[120px]" aria-hidden />;
  }

  if (isAuthenticated) {
    return (
      <Button size="sm" className="text-xs md:text-sm" asChild>
        <Link href="/learn">{isPayPage ? "返回学习" : "开始学习"}</Link>
      </Button>
    );
  }

  return (
    <Button size="sm" className="text-xs md:text-sm" asChild>
      <Link href={isPayPage ? `/signin?next=${encodeURIComponent("/pay?plan=yearly")}` : "/signin"}>立即使用</Link>
    </Button>
  );
}
