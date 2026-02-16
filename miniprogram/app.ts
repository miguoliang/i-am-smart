/**
 * WeChat miniprogram app entry
 */

import { login, isAuthenticated } from './utils/auth';
import { setApiBaseUrl } from './utils/api';
import { CONFIG } from './config';

console.log('Loading app.ts...');

App({
  onLaunch(options: WechatMiniprogram.App.LaunchShowOption) {
    console.log('=== App onLaunch START ===');
    console.log('App launched, options:', options);
    console.log('CONFIG:', CONFIG);
    console.log('API_BASE_URL:', CONFIG.API_BASE_URL);
    
    // Set API base URL from config
    setApiBaseUrl(CONFIG.API_BASE_URL);
    console.log('API base URL set to:', CONFIG.API_BASE_URL);
    
    // Check authentication and auto-login if needed
    this.checkAuth();
    console.log('=== App onLaunch END ===');
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
