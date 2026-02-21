/**
 * Shared user types for both Next.js web app and WeChat miniprogram
 */

import type { LearnerProfile } from './profile';

export interface User {
  id: string;
  email: string;
}

export interface Account {
  username: string | null;
  daily_due_limit: number;
  plan?: string;
  profiles?: LearnerProfile[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  user: User;
}
