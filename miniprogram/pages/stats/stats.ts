/**
 * Stats page - User statistics (matching PC version)
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import type { StatsData } from '../../shared/types/stats';

Page({
  data: {
    stats: null as StatsData | null,
    loading: false,
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    // Reload stats when page is shown
    this.loadStats();
  },

  async loadStats() {
    this.setData({ loading: true });

    try {
      const timezoneOffset = new Date().getTimezoneOffset();
      const stats = await request<StatsData>(
        `${API_ENDPOINTS.STATS}?offset=${timezoneOffset}`
      );
      
      // Generate full 30-day heatmap
      const fullHeatMap = Array(30).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = this.formatDate(date);
        
        // Find count in API response (sparse data)
        const found = stats.heatmap.find((h) => h.date === dateStr);
        return { date: dateStr, count: found ? found.count : 0 };
      });

      this.setData({
        stats: {
          ...stats,
          heatmap: fullHeatMap,
        },
        loading: false,
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
});
