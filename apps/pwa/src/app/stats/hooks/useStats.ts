import { useEffect, useState } from 'react'
import { toDateString } from '@/lib/utils/dateUtils'
import type { ApiResponse } from '@/lib/utils/apiError'
import { useProfile } from '@/hooks/useProfile'

export interface StatsData {
  total: number;
  mastered: number;
  learning: number;
  dueToday: number;
  heatMap: { date: string; count: number }[];
}

interface StatsApiPayload {
  stats: {
    total: number;
    mastered: number;
    learning: number;
    dueToday: number;
  };
  heatmap: { date: string; count: number }[];
}

export function useStats() {
  const { activeProfile } = useProfile();
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    mastered: 0,
    learning: 0,
    dueToday: 0,
    heatMap: []
  })
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const offset = new Date().getTimezoneOffset();
        const profileParam = activeProfile?.id ? `&profileId=${activeProfile.id}` : '';
        const res = await fetch(`/api/stats?offset=${offset}${profileParam}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        
        const response = (await res.json()) as ApiResponse<StatsApiPayload> | StatsApiPayload;
        const data: StatsApiPayload =
          response && typeof response === 'object' && 'data' in response
            ? (response.data as StatsApiPayload)
            : (response as StatsApiPayload);
        if (!data || !data.stats || !Array.isArray(data.heatmap)) {
          throw new Error('Failed to fetch stats');
        }
        
        // Generate last 30 days array
        const fullHeatMap = Array(30).fill(0).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          const dateStr = toDateString(date);
          
          // Find count in API response (sparse data)
          const found = data.heatmap.find((h: { date: string; count: number }) => h.date === dateStr);
          return { date: dateStr, count: found ? found.count : 0 };
        });

        setStats({
          total: data.stats.total,
          mastered: data.stats.mastered,
          learning: data.stats.learning,
          dueToday: data.stats.dueToday,
          heatMap: fullHeatMap
        });
      } catch {
        // Fail silently or handle error in UI state if needed
      }
    }
    fetchStats()
  }, [activeProfile?.id])

  return stats;
}
