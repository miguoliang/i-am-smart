"use client";

import { Button } from "@/components/form/Button";

interface TopNavProps {
  userEmail: string;
  onSignOut: () => void;
  loading?: boolean;
}

export function TopNav({ userEmail, onSignOut, loading = false }: TopNavProps) {
  return (
    <div className="flex justify-between items-center px-3 py-3 md:px-6 md:py-4 gap-2">
      <h1 className="text-lg md:text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
        运营后台
      </h1>
      <div className="flex items-center gap-2 md:gap-6 min-w-0">
        <span className="text-xs md:text-base text-muted-foreground truncate hidden sm:inline">
          {userEmail}
        </span>
        <Button
          onClick={onSignOut}
          loading={loading}
          className="px-3 md:px-6 py-1.5 md:py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs md:text-base font-medium transition-colors h-auto whitespace-nowrap"
        >
          退出
        </Button>
      </div>
    </div>
  );
}
