/**
 * Stats page - User statistics
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '@shared/constants/api';
import type { StatsData } from '@shared/types/stats';

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
      const stats = await request<StatsData>(API_ENDPOINTS.STATS);
      this.setData({
        stats,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      console.error('Failed to load stats:', error);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },
});
