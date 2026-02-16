/**
 * Home page - Learning page
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '@shared/constants/api';
import type { DueCardsResult, Card } from '@shared/types/card';
import { storage } from '../../utils/storage';
import { AVAILABLE_LEVELS, type Level } from '@shared/constants/levels';

Page({
  data: {
    cards: [] as Card[],
    loading: false,
    level: 'A1' as Level,
    levelIndex: 0,
    availableLevels: AVAILABLE_LEVELS,
    reviewedCount: 0,
  },

  onLoad() {
    const level = storage.getLevel() as Level;
    const levelIndex = AVAILABLE_LEVELS.indexOf(level);
    this.setData({
      level,
      levelIndex: levelIndex >= 0 ? levelIndex : 0,
    });
    this.loadCards();
  },

  onShow() {
    // Reload cards when page is shown
    this.loadCards();
  },

  async loadCards() {
    this.setData({ loading: true });
    
    try {
      const level = this.data.level;
      const result = await request<DueCardsResult>(
        `${API_ENDPOINTS.CARDS_DUE}?level=${level}`
      );

      this.setData({
        cards: result.cards || [],
        reviewedCount: result.reviewedCount || 0,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      console.error('Failed to load cards:', error);
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
    this.loadCards();
  },

  onCardTap(e: WechatMiniprogram.TouchEvent) {
    const cardId = e.currentTarget.dataset.id;
    if (cardId) {
      wx.navigateTo({
        url: `/pages/review/review?id=${cardId}`,
      });
    }
  },
});
