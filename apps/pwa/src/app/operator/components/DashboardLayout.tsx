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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation */}
      <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <button
            className="md:hidden p-4 text-gray-600 dark:text-gray-300"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? "关闭菜单" : "打开菜单"}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex-1">{topNav}</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-40
            w-64 md:w-1/5 min-w-[200px]
            bg-white dark:bg-gray-800
            border-r border-gray-200 dark:border-gray-700
            overflow-y-auto
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0
            top-0 md:top-auto
            h-full
          `}
        >
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
            <span className="font-semibold text-gray-900 dark:text-white">菜单</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-600 dark:text-gray-300"
              aria-label="关闭菜单"
            >
              <X size={20} />
            </button>
          </div>
          <div onClick={() => setSidebarOpen(false)}>
            {sidebar}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}
