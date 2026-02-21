/**
 * Shared learner profile types
 */

export interface LearnerProfile {
  id: string;
  account_id: string;
  name: string;
  avatar_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
