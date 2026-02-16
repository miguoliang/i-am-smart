/**
 * Home page - Learning page (Card flip style, matching PC version)
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import type { DueCardsResult, Card } from '../../shared/types/card';
import { storage } from '../../utils/storage';
import { AVAILABLE_LEVELS, type Level } from '../../shared/constants/levels';

console.log('Loading index page TypeScript file...');

Page({
  data: {
    cards: [] as Card[],
    loading: false,
    level: 'A1' as Level,
    levelIndex: 0,
    availableLevels: [...AVAILABLE_LEVELS] as Level[],
    reviewedCount: 0,
    currentIndex: 0,
    flipped: false,
  },

  onLoad(options: WechatMiniprogram.Page.ILoadOption) {
    console.log('=== index page onLoad START ===');
    console.log('onLoad options:', options);
    try {
      const level = storage.getLevel() as Level;
      console.log('Got level from storage:', level);
      const levelIndex = AVAILABLE_LEVELS.indexOf(level);
      console.log('Setting level:', level, 'levelIndex:', levelIndex);
      this.setData({
        level,
        levelIndex: levelIndex >= 0 ? levelIndex : 0,
      });
      console.log('Calling loadCards...');
      this.loadCards();
    } catch (error) {
      console.error('Error in onLoad:', error);
    }
    console.log('=== index page onLoad END ===');
  },

  onShow() {
    console.log('=== index page onShow START ===');
    // Reload cards when page is shown (if no cards or all reviewed)
    if (this.data.cards.length === 0 || this.isAllReviewed()) {
      console.log('Reloading cards in onShow, cards.length:', this.data.cards.length);
      this.loadCards();
    } else {
      console.log('Skipping reload, cards exist:', this.data.cards.length);
    }
    console.log('=== index page onShow END ===');
  },

  onReady() {
    console.log('=== index page onReady ===');
  },

  isAllReviewed(): boolean {
    return this.data.cards.length > 0 && this.data.cards.every((c) => c.reviewed);
  },

  async loadCards() {
    console.log('loadCards called, level:', this.data.level);
    this.setData({ loading: true });
    
    try {
      const level = this.data.level;
      const endpoint = `${API_ENDPOINTS.CARDS_DUE}?level=${level}`;
      console.log('Requesting endpoint:', endpoint);
      
      const result = await request<DueCardsResult>(endpoint);

      console.log('API response received:', result);

      const cards = (result?.cards || []).map((card: Card) => ({
        ...card,
        reviewed: false,
      }));

      const reviewedCount = typeof result?.reviewedCount === 'number' ? result.reviewedCount : 0;

      this.setData({
        cards,
        reviewedCount,
        currentIndex: 0,
        flipped: false,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载失败';
      console.error('Failed to load cards:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000,
      });
      // Reset to safe defaults on error
      this.setData({ 
        cards: [],
        reviewedCount: 0,
        currentIndex: 0,
        flipped: false,
        loading: false,
      });
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

  onCardTap() {
    // Toggle flip
    this.setData({
      flipped: !this.data.flipped,
    });
  },

  onSpeakUS() {
    const card = this.getCurrentCard();
    if (card) {
      this.speak(card.knowledge.name, 'en-US');
    }
  },

  onSpeakUK() {
    const card = this.getCurrentCard();
    if (card) {
      this.speak(card.knowledge.name, 'en-GB');
    }
  },

  speak(text: string, lang: 'en-US' | 'en-GB') {
    // Use WeChat miniprogram text-to-speech API
    // Note: WeChat miniprogram doesn't have built-in TTS, so we use a web API
    // For production, you might want to use a TTS service
    const audio = wx.createInnerAudioContext();
    // Using Youdao dict API as fallback (requires network)
    audio.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${lang === 'en-US' ? '1' : '2'}`;
    audio.autoplay = true;
    audio.onError((err) => {
      console.error('Speech error:', err);
      wx.showToast({
        title: '语音播放失败',
        icon: 'none',
      });
    });
    // Clean up after playback
    audio.onEnded(() => {
      audio.destroy();
    });
  },

  getCurrentCard(): Card | null {
    const { cards, currentIndex } = this.data;
    return cards[currentIndex] || null;
  },

  async onRate(quality: number) {
    const card = this.getCurrentCard();
    if (!card) return;

    try {
      await request(
        API_ENDPOINTS.CARD_REVIEW(card.id),
        {
          method: 'POST',
          data: { quality },
        }
      );

      // Mark card as reviewed
      const cards = this.data.cards.map((c, i) =>
        i === this.data.currentIndex ? { ...c, reviewed: true } : c
      );

      // Find next unreviewed card
      const nextIndex = cards.findIndex((c, i) => i > this.data.currentIndex && !c.reviewed);
      
      if (nextIndex !== -1) {
        // Move to next card
        this.setData({
          cards,
          currentIndex: nextIndex,
          flipped: false,
          reviewedCount: this.data.reviewedCount + 1,
        });
      } else {
        // All cards reviewed - move to end
        this.setData({
          cards,
          currentIndex: cards.length, // Set to length to trigger empty state
          flipped: false,
          reviewedCount: this.data.reviewedCount + 1,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '复习失败';
      console.error('Review failed:', error);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
      });
    }
  },

  onRate0() {
    this.onRate(0);
  },

  onRate3() {
    this.onRate(3);
  },

  onRate5() {
    this.onRate(5);
  },
});
