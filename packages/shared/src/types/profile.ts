/**
 * Shared learner profile types
 */

import type { Level } from '../constants/levels';

export interface LearnerProfile {
  id: string;
  account_id: string;
  name: string;
  avatar_index: number;
  level: Level;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
