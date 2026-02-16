/**
 * API request utilities for WeChat miniprogram
 */

import type { ApiResponse } from '../shared/types/api';
import { storage } from './storage';
import { login } from './auth';

/**
 * API base URL - set via setApiBaseUrl() in app.ts
 */
let apiBaseUrl = 'https://your-domain.com';

/**
 * Set API base URL (for runtime configuration)
 */
export function setApiBaseUrl(url: string): void {
  apiBaseUrl = url;
}

/**
 * Get API base URL
 */
export function getApiBaseUrlRuntime(): string {
  return apiBaseUrl;
}

/**
 * Make an API request with automatic token handling
 */
export async function request<T>(
  endpoint: string,
  options: Omit<WechatMiniprogram.RequestOption, 'url'> = {}
): Promise<T> {
  const token = storage.getAccessToken();
  const baseUrl = apiBaseUrl;

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${endpoint}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.header,
      },
      success: async (res) => {
        if (res.statusCode === 200) {
          const response = res.data as ApiResponse<T>;
          
          if (response.error) {
            reject(new Error(response.error.message || '请求失败'));
            return;
          }

          if (response.data !== undefined) {
            resolve(response.data);
          } else {
            reject(new Error('响应数据格式错误'));
          }
        } else if (res.statusCode === 401) {
          // Token expired or invalid, try to re-login
          try {
            storage.clearAuth();
            await login();
            
            // Retry the request with new token
            const newToken = storage.getAccessToken();
            if (!newToken) {
              reject(new Error('重新登录失败'));
              return;
            }

            wx.request({
              url: `${baseUrl}${endpoint}`,
              method: options.method || 'GET',
              data: options.data,
              header: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
                ...options.header,
              },
              success: (retryRes) => {
                if (retryRes.statusCode === 200) {
                  const retryResponse = retryRes.data as ApiResponse<T>;
                  if (retryResponse.error) {
                    reject(new Error(retryResponse.error.message || '请求失败'));
                  } else if (retryResponse.data !== undefined) {
                    resolve(retryResponse.data);
                  } else {
                    reject(new Error('响应数据格式错误'));
                  }
                } else {
                  reject(new Error(`请求失败: ${retryRes.statusCode}`));
                }
              },
              fail: reject,
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (error) => {
        reject(new Error(`网络请求失败: ${error.errMsg || '未知错误'}`));
      },
    });
  });
}

