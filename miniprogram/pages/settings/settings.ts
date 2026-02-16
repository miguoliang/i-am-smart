/**
 * Settings page - User settings
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import type { Account } from '../../shared/types/user';
import { logout } from '../../utils/auth';
import { AVAILABLE_LEVELS, type Level } from '../../shared/constants/levels';
import { storage } from '../../utils/storage';

Page({
  data: {
    account: null as Account | null,
    loading: false,
    level: 'A1' as Level,
    levelIndex: 0,
    availableLevels: AVAILABLE_LEVELS,
    dailyLimitPresets: [10, 50, 200],
    dailyLimitIndex: 0,
    dailyDueLimit: 10,
  },

  onLoad() {
    const level = storage.getLevel() as Level;
    const levelIndex = AVAILABLE_LEVELS.indexOf(level);
    this.setData({
      level,
      levelIndex: levelIndex >= 0 ? levelIndex : 0,
    });
    this.loadAccount();
  },

  async loadAccount() {
    this.setData({ loading: true });

    try {
      const account = await request<Account>(API_ENDPOINTS.ACCOUNTS_ME);
      const dailyLimit = account.daily_due_limit || 10;
      const dailyLimitIndex = this.data.dailyLimitPresets.indexOf(dailyLimit);
      this.setData({
        account,
        dailyDueLimit: dailyLimit,
        dailyLimitIndex: dailyLimitIndex >= 0 ? dailyLimitIndex : 0,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      console.error('Failed to load account:', error);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  onLevelChange(e: WechatMiniprogram.CustomEvent) {
    const index = parseInt(e.detail.value, 10);
    const level = AVAILABLE_LEVELS[index] as Level;
    this.setData({ 
      level,
      levelIndex: index,
    });
    storage.setLevel(level);
  },

  onDailyLimitChange(e: WechatMiniprogram.CustomEvent) {
    const index = parseInt(e.detail.value, 10);
    const limit = this.data.dailyLimitPresets[index];
    this.setData({ 
      dailyDueLimit: limit,
      dailyLimitIndex: index,
    });
    this.updateDailyLimit(limit);
  },

  async updateDailyLimit(limit: number) {
    try {
      // 小程序不支持 PATCH，使用 PUT 方法
      // 注意：后端需要支持 PUT 方法，或者添加一个 POST /api/accounts/me/update 端点
      await request(API_ENDPOINTS.ACCOUNTS_ME, {
        method: 'PUT',
        data: { daily_due_limit: limit },
      });
      wx.showToast({
        title: '更新成功',
        icon: 'success',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新失败';
      console.error('Failed to update daily limit:', error);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
      });
    }
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          logout();
          wx.reLaunch({
            url: '/pages/index/index',
          });
        }
      },
    });
  },
});
