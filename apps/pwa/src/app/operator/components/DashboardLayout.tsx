"use client";

import { ReactNode } from "react";

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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top Navigation - Full Width */}
      <div className="w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {topNav}
      </div>

      {/* Main Content Area - Flex Layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Sidebar - 20% width on desktop, full width on mobile */}
        <aside className="w-full md:w-1/5 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {sidebar}
        </aside>

        {/* Main Content - 80% width on desktop, full width on mobile */}
        <main className="flex-1 w-full md:w-4/5 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}

