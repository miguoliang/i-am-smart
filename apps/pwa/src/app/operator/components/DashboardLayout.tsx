"use client";

import { ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  topNav: ReactNode;
  sidebar: ReactNode;
}

export function DashboardLayout({
  children,
  topNav,
  sidebar,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center">
          <button
            type="button"
            className="p-3 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "关闭菜单" : "打开菜单"}
          >
            {sidebarOpen ? <X size={20} strokeWidth={1.75} /> : <Menu size={20} strokeWidth={1.75} />}
          </button>
          <div className="min-w-0 flex-1">{topNav}</div>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 items-stretch overflow-hidden">
        {sidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-foreground/10 md:hidden"
            aria-label="关闭菜单"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <aside
          className={`
            fixed inset-y-0 left-0 z-40 flex w-[240px] shrink-0 flex-col border-r border-border bg-background
            transition-transform duration-200 ease-out md:static md:h-auto md:min-h-0 md:translate-x-0 md:self-stretch
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex items-center justify-between border-b border-border p-3 md:hidden">
            <span className="text-sm font-medium">菜单</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-muted-foreground hover:text-foreground"
              aria-label="关闭菜单"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
            {sidebar}
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
