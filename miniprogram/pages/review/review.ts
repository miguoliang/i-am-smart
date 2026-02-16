/**
 * Review page - Review a single card
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '@shared/constants/api';
import type { Card, ReviewCardResult } from '@shared/types/card';

const QUALITY_OPTIONS = [
  { value: 0, label: '完全忘记' },
  { value: 1, label: '困难' },
  { value: 2, label: '一般' },
  { value: 3, label: '容易' },
  { value: 4, label: '很简单' },
  { value: 5, label: '完美' },
];

Page({
  data: {
    card: null as Card | null,
    loading: false,
    qualityOptions: QUALITY_OPTIONS,
    selectedQuality: 3,
  },

  onLoad(options: { id?: string }) {
    if (options.id) {
      // TODO: Implement card detail loading
      this.loadCard();
    } else {
      wx.showToast({
        title: '卡片ID无效',
        icon: 'none',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  async loadCard() {
    // For now, we'll need to get card from the due cards list
    // In a real implementation, you might want a GET /api/cards/:id endpoint
    this.setData({ loading: true });
    
    // TODO: Implement card detail loading
    // For now, navigate back if card not found
    wx.showToast({
      title: '加载卡片详情功能待实现',
      icon: 'none',
    });
    this.setData({ loading: false });
  },

  onQualityChange(e: WechatMiniprogram.CustomEvent) {
    const quality = parseInt(e.detail.value, 10);
    this.setData({ selectedQuality: quality });
  },

  async submitReview() {
    const card = this.data.card;
    if (!card) {
      wx.showToast({
        title: '卡片数据无效',
        icon: 'none',
      });
      return;
    }

    const quality = this.data.selectedQuality;
    
    this.setData({ loading: true });

    try {
      await request<ReviewCardResult>(
        API_ENDPOINTS.CARD_REVIEW(card.id),
        {
          method: 'POST',
          data: { quality },
        }
      );

      wx.showToast({
        title: '复习成功',
        icon: 'success',
      });

      // Navigate back after a short delay
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '复习失败';
      console.error('Review failed:', error);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
      });
      this.setData({ loading: false });
    }
  },
});
