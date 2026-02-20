/**
 * Stats page - User statistics (matching PC version)
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import type { StatsData } from '../../shared/types/stats';
import { isAuthenticated } from '../../utils/auth';
import { storage } from '../../utils/storage';

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallbackMessage;
}

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
      const profileId = storage.getActiveProfileId();
      let statsUrl = `${API_ENDPOINTS.STATS}?offset=${timezoneOffset}`;
      if (profileId) {
        statsUrl += `&profileId=${profileId}`;
      }
      const response = await request<StatsData>(statsUrl);
      
      console.log('Stats API response:', response);
      
      // Validate response structure
      if (!response || !response.stats || !response.heatmap) {
        console.error('Invalid stats response structure:', response);
        throw new Error('统计数据格式错误');
      }
      
      // Generate full 30-day heatmap
      const fullHeatMap = Array(30).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = this.formatDate(date);
        
        // Find count in API response (sparse data)
        const found = response.heatmap.find((h) => h.date === dateStr);
        return { date: dateStr, count: found ? found.count : 0 };
      });

      // Ensure all stats fields have default values
      const statsData: StatsData = {
        stats: {
          total: response.stats?.total ?? 0,
          mastered: response.stats?.mastered ?? 0,
          learning: response.stats?.learning ?? 0,
          dueToday: response.stats?.dueToday ?? 0,
        },
        heatmap: fullHeatMap,
      };

      console.log('Setting stats data:', statsData);

      this.setData({
        stats: statsData,
        loading: false,
      });
    } catch (error: unknown) {
      console.error('Failed to load stats:', error);
      wx.showToast({
        title: getErrorMessage(error, '加载失败'),
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
