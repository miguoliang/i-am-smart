"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/form/Button";
import { CalendarPlus, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const REMIND_HOUR_PRESETS = [8, 9, 10, 20, 21] as const;

interface CalendarReminderProps {
  calendarToken: string | null;
  calendarRemindHour: number;
  isLoading: boolean;
}

export function CalendarReminder({ calendarToken, calendarRemindHour, isLoading }: CalendarReminderProps) {
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const feedUrl = calendarToken
    ? `${window.location.origin}/api/calendar/feed.ics?token=${calendarToken}`
    : null;

  const updateHourMutation = useMutation({
    mutationFn: async (hour: number) => {
      const res = await fetch("/api/accounts/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendar_remind_hour: hour }),
      });
      if (!res.ok) throw new Error("更新失败");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "me"] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/calendar/regenerate", { method: "POST" });
      if (!res.ok) throw new Error("重新生成失败");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "me"] });
      toast.success("日历令牌已更新，旧订阅将失效");
    },
  });

  const handleCopy = async () => {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast.success("已复制订阅链接");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        日历提醒
      </h3>
      <p className="text-xs text-muted-foreground">
        添加到手机日历，每天自动提醒你复习
      </p>

      {/* Remind hour presets */}
      <div className="flex gap-2 flex-wrap">
        {REMIND_HOUR_PRESETS.map((hour) => (
          <Button
            key={hour}
            type="button"
            variant={calendarRemindHour === hour ? "default" : "outline"}
            size="sm"
            onClick={() => updateHourMutation.mutate(hour)}
            disabled={updateHourMutation.isPending}
          >
            {hour}:00
          </Button>
        ))}
      </div>

      {/* Copy subscription URL */}
      {feedUrl && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已复制" : "复制订阅链接"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            title="重新生成（旧订阅将失效）"
          >
            <RefreshCw className={cn("h-4 w-4", regenerateMutation.isPending && "animate-spin")} />
          </Button>
        </div>
      )}

      {/* Direct add link for mobile */}
      {feedUrl && (
        <a
          href={feedUrl}
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <CalendarPlus className="h-4 w-4" />
          直接打开订阅
        </a>
      )}
    </div>
  );
}
