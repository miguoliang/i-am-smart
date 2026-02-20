export interface LearnerProfile {
  id: string;
  account_id: string;
  name: string;
  avatar_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRepository {
  getProfilesByAccountId(accountId: string): Promise<LearnerProfile[]>;
  getProfileById(profileId: string, accountId: string): Promise<LearnerProfile | null>;
  createProfile(accountId: string, name: string): Promise<LearnerProfile>;
  updateProfile(profileId: string, accountId: string, name: string): Promise<LearnerProfile>;
  deleteProfile(profileId: string, accountId: string): Promise<void>;
  getProfileCount(accountId: string): Promise<number>;
}
