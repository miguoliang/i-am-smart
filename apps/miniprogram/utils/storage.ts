/**
 * Local storage utilities for WeChat miniprogram
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const LEVEL_KEY = 'learn_level';

export const storage = {
  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    try {
      return wx.getStorageSync(ACCESS_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  /**
   * Set access token to storage
   */
  setAccessToken(token: string): void {
    try {
      wx.setStorageSync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save access token:', error);
    }
  },

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    try {
      return wx.getStorageSync(REFRESH_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  /**
   * Set refresh token to storage
   */
  setRefreshToken(token: string): void {
    try {
      wx.setStorageSync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  },

  /**
   * Clear all auth tokens
   */
  clearAuth(): void {
    try {
      wx.removeStorageSync(ACCESS_TOKEN_KEY);
      wx.removeStorageSync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear auth tokens:', error);
    }
  },

  /**
   * Get learning level from storage
   */
  getLevel(): string {
    try {
      return wx.getStorageSync(LEVEL_KEY) || 'A1';
    } catch {
      return 'A1';
    }
  },

  /**
   * Set learning level to storage
   */
  setLevel(level: string): void {
    try {
      wx.setStorageSync(LEVEL_KEY, level);
    } catch (error) {
      console.error('Failed to save level:', error);
    }
  },
};
