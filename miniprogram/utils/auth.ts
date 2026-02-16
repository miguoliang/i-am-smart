/**
 * Authentication utilities for WeChat miniprogram
 */

import { API_ENDPOINTS } from '@shared/constants/api';
import type { LoginResponse } from '@shared/types/user';
import { storage } from './storage';
import { request } from './api';

/**
 * Login using WeChat miniprogram code
 * @returns Access token
 */
export async function login(): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            const response = await request<LoginResponse>(
              API_ENDPOINTS.MINIPROGRAM_LOGIN,
              {
                method: 'POST',
                data: { code: res.code },
              }
            );

            const { access_token, refresh_token } = response;
            
            // Save tokens
            storage.setAccessToken(access_token);
            if (refresh_token) {
              storage.setRefreshToken(refresh_token);
            }

            resolve(access_token);
          } catch (error) {
            console.error('Login failed:', error);
            reject(error);
          }
        } else {
          reject(new Error('获取 code 失败'));
        }
      },
      fail: (error) => {
        reject(new Error(`微信登录失败: ${error.errMsg || '未知错误'}`));
      },
    });
  });
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!storage.getAccessToken();
}

/**
 * Logout and clear auth tokens
 */
export function logout(): void {
  storage.clearAuth();
}
