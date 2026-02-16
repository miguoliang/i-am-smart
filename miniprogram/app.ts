/**
 * WeChat miniprogram app entry
 */

import { login, isAuthenticated } from './utils/auth';
import { setApiBaseUrl } from './utils/api';
import { CONFIG } from './config';

App({
  onLaunch() {
    console.log('App launched');
    
    // Set API base URL from config
    setApiBaseUrl(CONFIG.API_BASE_URL);
    
    // Check authentication and auto-login if needed
    this.checkAuth();
  },

  async checkAuth() {
    if (!isAuthenticated()) {
      try {
        await login();
        console.log('Auto-login successful');
      } catch (error) {
        console.error('Auto-login failed:', error);
        // Show error to user if needed
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none',
        });
      }
    }
  },

  globalData: {
    userInfo: null,
  },
});
