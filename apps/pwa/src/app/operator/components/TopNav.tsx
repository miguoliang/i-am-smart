"use client";

import { Button } from "@/components/form/Button";

interface TopNavProps {
  userEmail: string;
  onSignOut: () => void;
  loading?: boolean;
}

export function TopNav({ userEmail, onSignOut, loading = false }: TopNavProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 md:px-5 md:py-3">
      <span className="text-sm font-semibold tracking-tight text-foreground">
        运营后台
      </span>
      <div className="flex min-w-0 items-center gap-2 md:gap-4">
        <span className="hidden truncate text-xs text-muted-foreground sm:inline md:text-sm">
          {userEmail}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOut}
          loading={loading}
          className="h-8 shrink-0 px-3 text-xs font-medium md:h-9 md:text-sm"
        >
          退出
        </Button>
      </div>
    </div>
  );
}
