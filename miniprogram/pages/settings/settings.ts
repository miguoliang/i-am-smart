/**
 * Settings page - User settings (matching PC version)
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import type { Account } from '../../shared/types/user';
import { isAuthenticated } from '../../utils/auth';
import { AVAILABLE_LEVELS, type Level } from '../../shared/constants/levels';
import { storage } from '../../utils/storage';

const DAILY_DUE_LIMIT_PRESETS = [10, 50, 200] as const;

Page({
  data: {
    account: null as Account | null,
    loading: false,
    level: 'A1' as Level,
    levelIndex: 0,
    availableLevels: AVAILABLE_LEVELS,
    dailyLimitPresets: DAILY_DUE_LIMIT_PRESETS,
    dailyLimitIndex: 0,
    dailyDueLimit: 10,
  },

  async onLoad() {
    const level = storage.getLevel() as Level;
    const levelIndex = AVAILABLE_LEVELS.indexOf(level);
    this.setData({
      level,
      levelIndex: levelIndex >= 0 ? levelIndex : 0,
    });
    // Wait for authentication before loading account
    await this.waitForAuth();
    this.loadAccount();
  },

  async waitForAuth() {
    const app = getApp();
    if (app.globalData.authPromise) {
      try {
        const isAuth = await app.globalData.authPromise;
        if (!isAuth) {
          console.log('Not authenticated, cannot load account');
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

  async loadAccount() {
    if (!isAuthenticated()) {
      console.log('User not authenticated, cannot load account');
      return;
    }

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
    } catch (error: any) {
      console.error('Failed to load account:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },

  onLevelChange(e: WechatMiniprogram.TouchEvent) {
    const index = parseInt(e.currentTarget.dataset.index || '0', 10);
    const level = AVAILABLE_LEVELS[index] as Level;
    
    // Check if Pro level (B1, B2)
    if (['B1', 'B2'].includes(level)) {
      wx.showModal({
        title: 'Pro 功能',
        content: 'B1 和 B2 等级需要 Pro 会员，请访问网页版购买',
        showCancel: false,
      });
      return;
    }
    
    // Check if coming soon (C1, C2)
    if (['C1', 'C2'].includes(level)) {
      wx.showToast({
        title: '敬请期待',
        icon: 'none',
      });
      return;
    }

    this.setData({ 
      level,
      levelIndex: index,
    });
    storage.setLevel(level);
  },

  onDailyLimitChange(e: WechatMiniprogram.TouchEvent) {
    const index = parseInt(e.currentTarget.dataset.index || '0', 10);
    const limit = this.data.dailyLimitPresets[index];
    if (limit === undefined) {
      console.error('Invalid daily limit index:', index);
      return;
    }
    this.setData({ 
      dailyDueLimit: limit,
      dailyLimitIndex: index,
    });
    this.updateDailyLimit(limit);
  },

  async updateDailyLimit(limit: number) {
    try {
      await request(API_ENDPOINTS.ACCOUNTS_ME, {
        method: 'PUT',
        data: { daily_due_limit: limit },
      });
      wx.showToast({
        title: '更新成功',
        icon: 'success',
      });
    } catch (error: any) {
      console.error('Failed to update daily limit:', error);
      wx.showToast({
        title: error.message || '更新失败',
        icon: 'none',
      });
    }
  },

});
