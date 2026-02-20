/**
 * Authentication utilities for WeChat miniprogram
 */

import { API_ENDPOINTS } from '../shared/constants/api';
import type { LoginResponse } from '../shared/types/user';
import { storage } from './storage';
import { request } from './api';

// Prevent concurrent login attempts
let loginPromise: Promise<string> | null = null;

/**
 * Login using WeChat miniprogram code
 * @returns Access token
 */
export async function login(): Promise<string> {
  // If a login is already in progress, return the existing promise
  if (loginPromise) {
    console.log('Login already in progress, waiting...');
    return loginPromise;
  }

  loginPromise = new Promise((resolve, reject) => {
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            console.log('Starting login request...');
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

            console.log('Login successful');
            resolve(access_token);
          } catch (error) {
            console.error('Login failed:', error);
            reject(error);
          } finally {
            // Clear the promise so next login can proceed
            loginPromise = null;
          }
        } else {
          loginPromise = null;
          reject(new Error('获取 code 失败'));
        }
      },
      fail: (error) => {
        loginPromise = null;
        reject(new Error(`微信登录失败: ${error.errMsg || '未知错误'}`));
      },
    });
  });

  return loginPromise;
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
