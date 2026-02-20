import { ProfileRepository, LearnerProfile } from '@/lib/repositories/profile.repository';
import { ApiError } from '@/lib/utils/apiErrorClasses';

const PROFILE_LIMITS: Record<string, number> = {
  free: 2,
  pro: 10,
};

export class ProfileService {
  constructor(private profileRepository: ProfileRepository) {}

  async getProfiles(accountId: string): Promise<LearnerProfile[]> {
    return this.profileRepository.getProfilesByAccountId(accountId);
  }

  async getDefaultProfile(accountId: string): Promise<LearnerProfile> {
    const profiles = await this.profileRepository.getProfilesByAccountId(accountId);
    const defaultProfile = profiles.find((p) => p.is_default);
    if (!defaultProfile) {
      throw ApiError.internal('默认学习档案不存在');
    }
    return defaultProfile;
  }

  async createProfile(accountId: string, name: string, plan: string): Promise<LearnerProfile> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) {
      throw ApiError.validationError('档案名称需要1-20个字符');
    }

    const limit = PROFILE_LIMITS[plan] ?? PROFILE_LIMITS.free;
    const count = await this.profileRepository.getProfileCount(accountId);

    if (count >= limit) {
      throw ApiError.validationError(
        plan === 'free'
          ? `免费版最多创建 ${limit} 个学习档案，升级 Pro 可创建更多`
          : `当前套餐最多创建 ${limit} 个学习档案`
      );
    }

    return this.profileRepository.createProfile(accountId, trimmed);
  }

  async updateProfile(profileId: string, accountId: string, name: string): Promise<LearnerProfile> {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) {
      throw ApiError.validationError('档案名称需要1-20个字符');
    }

    const existing = await this.profileRepository.getProfileById(profileId, accountId);
    if (!existing) {
      throw ApiError.notFound('学习档案不存在');
    }

    return this.profileRepository.updateProfile(profileId, accountId, trimmed);
  }

  async deleteProfile(profileId: string, accountId: string): Promise<void> {
    const existing = await this.profileRepository.getProfileById(profileId, accountId);
    if (!existing) {
      throw ApiError.notFound('学习档案不存在');
    }
    if (existing.is_default) {
      throw ApiError.validationError('不能删除默认学习档案');
    }

    await this.profileRepository.deleteProfile(profileId, accountId);
  }
}
