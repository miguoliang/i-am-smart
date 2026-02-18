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

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  return typeof value === 'object' && value !== null && ('data' in value || 'error' in value);
}

function extractResponseData<T>(payload: unknown): T {
  if (isApiEnvelope<T>(payload)) {
    if (payload.error) {
      throw new Error(payload.error.message || '请求失败');
    }
    if (payload.data !== undefined) {
      return payload.data;
    }
    throw new Error('响应数据格式错误');
  }

  if (payload !== undefined && payload !== null) {
    return payload as T;
  }

  throw new Error('响应数据格式错误');
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
  const fullUrl = `${baseUrl}${endpoint}`;

  // Skip auth check for login endpoint
  const isLoginEndpoint = endpoint.includes('/auth/miniprogram/login');
  
  if (!isLoginEndpoint && !token) {
    console.error('API request without token:', {
      url: fullUrl,
      endpoint,
    });
    throw new Error('未登录，请先登录');
  }

  console.log('API request:', {
    url: fullUrl,
    method: options.method || 'GET',
    hasToken: !!token,
    baseUrl,
    endpoint,
  });

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.header,
      },
      success: async (res) => {
        console.log('API response status:', res.statusCode);
        console.log('API response summary:', {
          endpoint,
          hasBody: res.data !== undefined && res.data !== null,
          bodyType: typeof res.data,
        });
        
        if (res.statusCode === 200) {
          try {
            resolve(extractResponseData<T>(res.data));
          } catch (error) {
            reject(error);
          }
        } else if (res.statusCode === 401) {
          // Token expired or invalid, try to re-login
          console.log('API request returned 401, attempting re-login...');
          try {
            // Clear old token first
            storage.clearAuth();
            
            // Re-login (login() function handles concurrent calls)
            await login();
            
            // Retry the request with new token
            const newToken = storage.getAccessToken();
            if (!newToken) {
              console.error('Re-login failed: no token received');
              reject(new Error('重新登录失败'));
              return;
            }

            console.log('Re-login successful, retrying request...');
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
                  try {
                    resolve(extractResponseData<T>(retryRes.data));
                  } catch (error) {
                    reject(error);
                  }
                } else {
                  reject(new Error(`请求失败: ${retryRes.statusCode}`));
                }
              },
              fail: reject,
            });
          } catch (error) {
            console.error('Re-login failed:', error);
            reject(error);
          }
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (error) => {
        console.error('API request failed:', error);
        reject(new Error(`网络请求失败: ${error.errMsg || '未知错误'}`));
      },
    });
  });
}

