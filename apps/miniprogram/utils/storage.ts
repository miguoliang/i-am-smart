/**
 * Local storage utilities for WeChat miniprogram
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const LEVEL_KEY = 'learn_level';
const ACTIVE_PROFILE_KEY = 'active_profile_id';

export const storage = {
  getAccessToken(): string | null {
    try {
      return wx.getStorageSync(ACCESS_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  setAccessToken(token: string): void {
    try {
      wx.setStorageSync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save access token:', error);
    }
  },

  getRefreshToken(): string | null {
    try {
      return wx.getStorageSync(REFRESH_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  },

  setRefreshToken(token: string): void {
    try {
      wx.setStorageSync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save refresh token:', error);
    }
  },

  clearAuth(): void {
    try {
      wx.removeStorageSync(ACCESS_TOKEN_KEY);
      wx.removeStorageSync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear auth tokens:', error);
    }
  },

  getLevel(): string {
    try {
      return wx.getStorageSync(LEVEL_KEY) || 'A1';
    } catch {
      return 'A1';
    }
  },

  setLevel(level: string): void {
    try {
      wx.setStorageSync(LEVEL_KEY, level);
    } catch (error) {
      console.error('Failed to save level:', error);
    }
  },

  getActiveProfileId(): string | null {
    try {
      return wx.getStorageSync(ACTIVE_PROFILE_KEY) || null;
    } catch {
      return null;
    }
  },

  setActiveProfileId(id: string): void {
    try {
      wx.setStorageSync(ACTIVE_PROFILE_KEY, id);
    } catch (error) {
      console.error('Failed to save active profile id:', error);
    }
  },
};
