"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItem {
  href: string;
  label: string;
  icon?: string;
}

const sidebarItems: SidebarItem[] = [
  { href: "/operator", label: "仪表盘", icon: "📊" },
  { href: "/operator/saas", label: "SaaS 指标", icon: "📈" },
  { href: "/operator/orders", label: "订单管理", icon: "💰" },
  { href: "/operator/knowledges", label: "单词列表", icon: "📚" },
  { href: "/operator/knowledge-error-reports", label: "词条纠错", icon: "✏️" },
  { href: "/operator/import", label: "导入词库", icon: "📥" },
  { href: "/operator/accounts", label: "账户管理", icon: "👥" },
  { href: "/operator/push", label: "推送通知", icon: "🔔" },
  { href: "/operator/feedback", label: "用户反馈", icon: "💬" },
  { href: "/operator/logs", label: "操作日志", icon: "📋" },
  // Add more sidebar items here as needed
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="p-3 md:p-6">
      <ul className="space-y-1 md:space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.icon && <span className="text-xl">{item.icon}</span>}
                <span className="text-sm md:text-base">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

