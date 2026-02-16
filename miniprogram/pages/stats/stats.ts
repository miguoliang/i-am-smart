/**
 * Stats page - User statistics (matching PC version)
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import type { StatsData } from '../../shared/types/stats';
import { isAuthenticated } from '../../utils/auth';

Page({
  data: {
    stats: null as StatsData | null,
    loading: false,
  },

  async onLoad() {
    // Wait for authentication before loading stats
    await this.waitForAuth();
    this.loadStats();
  },

  async onShow() {
    // Wait for authentication before loading stats
    await this.waitForAuth();
    // Reload stats when page is shown
    this.loadStats();
  },

  async waitForAuth() {
    const app = getApp();
    if (app.globalData.authPromise) {
      try {
        const isAuth = await app.globalData.authPromise;
        if (!isAuth) {
          console.log('Not authenticated, cannot load stats');
          return false;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        return false;
      }
    } else if (!isAuthenticated()) {
      console.log('No auth promise and not authenticated');
      return false;
    }
    return true;
  },

  async loadStats() {
    if (!isAuthenticated()) {
      console.log('User not authenticated, cannot load stats');
      return;
    }

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
