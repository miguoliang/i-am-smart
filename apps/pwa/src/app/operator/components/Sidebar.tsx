"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  LineChart,
  Wallet,
  BookOpen,
  Users,
  Bell,
  MessageSquare,
  Mail,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const sidebarItems: SidebarItem[] = [
  { href: "/operator", label: "仪表盘", icon: LayoutDashboard },
  { href: "/operator/saas", label: "SaaS 指标", icon: LineChart },
  { href: "/operator/orders", label: "订单管理", icon: Wallet },
  { href: "/operator/knowledges", label: "词库管理", icon: BookOpen },
  { href: "/operator/accounts", label: "账户管理", icon: Users },
  { href: "/operator/push", label: "推送通知", icon: Bell },
  { href: "/operator/feedback", label: "用户反馈", icon: MessageSquare },
  { href: "/operator/contact-messages", label: "用户留言", icon: Mail },
  { href: "/operator/logs", label: "操作日志", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-3 md:p-4">
      <ul className="space-y-0.5">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/operator/knowledges" &&
              pathname.startsWith("/operator/knowledge"));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
