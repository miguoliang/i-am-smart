import { SupabaseClient } from '@supabase/supabase-js';
import { ProfileRepository, LearnerProfile } from '../profile.repository';
import { handleRepositoryError } from '../utils/error-handling';
import type { Level } from '@i-am-smart/shared/constants';

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private client: SupabaseClient) {}

  async getProfilesByAccountId(accountId: string): Promise<LearnerProfile[]> {
    const { data, error } = await this.client
      .from('learner_profiles')
      .select('*')
      .eq('account_id', accountId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      handleRepositoryError(error, 'List profiles');
    }

    return data ?? [];
  }

  async getProfileById(profileId: string, accountId: string): Promise<LearnerProfile | null> {
    const { data, error } = await this.client
      .from('learner_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('account_id', accountId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async createProfile(accountId: string, name: string, level?: Level): Promise<LearnerProfile> {
    const { data, error } = await this.client
      .from('learner_profiles')
      .insert({
        account_id: accountId,
        name,
        is_default: false,
        ...(level && { level }),
      })
      .select()
      .single();

    if (error) {
      handleRepositoryError(error, 'Create profile');
    }

    return data!;
  }

  async updateProfile(profileId: string, accountId: string, updates: { name?: string; level?: Level }): Promise<LearnerProfile> {
    const { data, error } = await this.client
      .from('learner_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .eq('account_id', accountId)
      .select()
      .single();

    if (error) {
      handleRepositoryError(error, 'Update profile');
    }

    return data!;
  }

  async deleteProfile(profileId: string, accountId: string): Promise<void> {
    const { error } = await this.client
      .from('learner_profiles')
      .delete()
      .eq('id', profileId)
      .eq('account_id', accountId)
      .eq('is_default', false);

    if (error) {
      handleRepositoryError(error, 'Delete profile');
    }
  }

  async getProfileCount(accountId: string): Promise<number> {
    const { count, error } = await this.client
      .from('learner_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId);

    if (error) {
      handleRepositoryError(error, 'Count profiles');
    }

    return count ?? 0;
  }
}
