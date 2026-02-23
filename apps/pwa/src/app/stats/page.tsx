// src/app/stats/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/form/Button'
import { LogOut } from 'lucide-react'
import { useStats } from './hooks/useStats'

export default function Stats() {
  const stats = useStats()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="gap-2"
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

        {/* 热力图 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">过去 30 天学习热力</h2>
          <div className="grid grid-cols-15 gap-2">
            {stats.heatMap.map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg transition-all ${
                  day.count === 0 ? 'bg-gray-200 dark:bg-gray-700' :
                  day.count < 5 ? 'bg-green-300 dark:bg-green-800' :
                  day.count < 10 ? 'bg-green-500 dark:bg-green-600' :
                  'bg-green-700 dark:bg-green-500'
                }`}
                title={`${day.date}: ${day.count} 次`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}