// src/app/stats/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/form/Button";
import { SignOutLockOverlay } from "@/components/overlay/SignOutLockOverlay";
import { LogOut } from "lucide-react";
import { useStats } from "./hooks/useStats";

export default function Stats() {
  const stats = useStats();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      {isSigningOut ? <SignOutLockOverlay /> : null}
      <div className="absolute top-4 right-4">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="gap-2"
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">退出登录</span>
        </Button>
      </div>
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-10 text-center">我的学习统计</h1>

        {/* 四宫格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: '总词量', value: stats.total, color: 'bg-blue-500' },
            { label: '已掌握', value: stats.mastered, color: 'bg-green-500' },
            { label: '学习中', value: stats.learning, color: 'bg-yellow-500' },
            { label: '今日待复习', value: stats.dueToday, color: 'bg-red-500' },
          ].map(s => (
            <div key={s.label} className={`${s.color} text-white rounded-2xl p-6 text-center`}>
              <p className="text-5xl font-bold">{s.value}</p>
              <p className="text-xl mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 考试目标完成进度 */}
        {stats.total > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">考试目标完成进度</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((stats.mastered / stats.total) * 100))}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                已掌握 {stats.mastered} / 总共 {stats.total} 词（{Math.round((stats.mastered / stats.total) * 100)}%）
              </span>
            </div>
          </div>
        )}

        {/* 学习趋势 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">过去 30 天学习趋势</h2>
          <div className="space-y-2">
            {stats.heatMap.filter(day => day.count > 0).slice(-10).map((day, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-24">{day.date}</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-green-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (day.count / 20) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16 text-right">
                  {day.count} 词
                </span>
              </div>
            ))}
            {stats.heatMap.filter(day => day.count > 0).length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">还没有学习记录，开始学习吧！</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}