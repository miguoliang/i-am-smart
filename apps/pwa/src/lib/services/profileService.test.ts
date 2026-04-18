import { ProfileService } from './profileService';
import type { LearnerProfile, ProfileRepository } from '@/lib/repositories/profile.repository';

function mockProfile(overrides?: Partial<LearnerProfile>): LearnerProfile {
  return {
    id: 'p1',
    account_id: 'a1',
    name: 'Learner',
    avatar_index: 0,
    level: 'A1',
    is_default: true,
    created_at: 't',
    updated_at: 't',
    ...overrides,
  };
}

describe('ProfileService', () => {
  let repo: jest.Mocked<ProfileRepository>;
  let service: ProfileService;

  beforeEach(() => {
    repo = {
      getProfilesByAccountId: jest.fn(),
      getProfileById: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      getProfileCount: jest.fn(),
    };
    service = new ProfileService(repo);
  });

  describe('getProfiles', () => {
    it('delegates to repository', async () => {
      const list = [mockProfile()];
      repo.getProfilesByAccountId.mockResolvedValue(list);
      await expect(service.getProfiles('a1')).resolves.toEqual(list);
      expect(repo.getProfilesByAccountId).toHaveBeenCalledWith('a1');
    });
  });

  describe('getDefaultProfile', () => {
    it('throws when no default profile', async () => {
      repo.getProfilesByAccountId.mockResolvedValue([mockProfile({ is_default: false })]);
      await expect(service.getDefaultProfile('a1')).rejects.toThrow(/默认学习档案不存在/);
    });

    it('returns default profile', async () => {
      const def = mockProfile({ id: 'd', is_default: true });
      repo.getProfilesByAccountId.mockResolvedValue([
        mockProfile({ is_default: false }),
        def,
      ]);
      await expect(service.getDefaultProfile('a1')).resolves.toEqual(def);
    });
  });

  describe('createProfile', () => {
    it('rejects empty name', async () => {
      await expect(service.createProfile('a1', '   ', 'free')).rejects.toThrow(/1-20/);
    });

    it('rejects name longer than 20', async () => {
      await expect(service.createProfile('a1', 'x'.repeat(21), 'free')).rejects.toThrow(/1-20/);
    });

    it('rejects when free plan at limit', async () => {
      repo.getProfileCount.mockResolvedValue(2);
      await expect(service.createProfile('a1', 'ok', 'free')).rejects.toThrow(/免费版最多创建/);
    });

    it('rejects when pro plan at limit', async () => {
      repo.getProfileCount.mockResolvedValue(10);
      await expect(service.createProfile('a1', 'ok', 'pro')).rejects.toThrow(/当前套餐最多创建/);
    });

    it('creates trimmed profile', async () => {
      repo.getProfileCount.mockResolvedValue(0);
      const created = mockProfile({ name: 'trim' });
      repo.createProfile.mockResolvedValue(created);
      await expect(service.createProfile('a1', '  trim  ', 'free')).resolves.toEqual(created);
      expect(repo.createProfile).toHaveBeenCalledWith('a1', 'trim');
    });
  });

  describe('updateProfile', () => {
    it('validates name when provided', async () => {
      await expect(
        service.updateProfile('p1', 'a1', { name: '' })
      ).rejects.toThrow(/1-20/);
    });

    it('rejects invalid exam_target', async () => {
      await expect(
        service.updateProfile('p1', 'a1', { exam_target: 'nope' })
      ).rejects.toThrow(/无效的考试目标/);
    });

    it('applies exam_target and primary level', async () => {
      repo.getProfileById.mockResolvedValue(mockProfile());
      const updated = mockProfile({ level: 'A2', exam_target: 'ket' });
      repo.updateProfile.mockResolvedValue(updated);
      const result = await service.updateProfile('p1', 'a1', { exam_target: 'ket' });
      expect(result).toEqual(updated);
      expect(repo.updateProfile).toHaveBeenCalledWith(
        'p1',
        'a1',
        expect.objectContaining({ exam_target: 'ket', level: 'A2' })
      );
    });

    it('updates level when valid', async () => {
      repo.getProfileById.mockResolvedValue(mockProfile());
      repo.updateProfile.mockResolvedValue(mockProfile({ level: 'B1' }));
      await service.updateProfile('p1', 'a1', { level: 'B1' });
      expect(repo.updateProfile).toHaveBeenCalledWith('p1', 'a1', { level: 'B1' });
    });

    it('rejects invalid level', async () => {
      await expect(
        service.updateProfile('p1', 'a1', { level: 'Z9' as 'A1' })
      ).rejects.toThrow(/无效的级别/);
    });

    it('rejects empty patch', async () => {
      await expect(service.updateProfile('p1', 'a1', {})).rejects.toThrow(/没有需要更新的字段/);
    });

    it('rejects when profile missing', async () => {
      repo.getProfileById.mockResolvedValue(null);
      await expect(
        service.updateProfile('p1', 'a1', { name: 'x' })
      ).rejects.toThrow(/学习档案不存在/);
    });
  });

  describe('deleteProfile', () => {
    it('rejects when missing', async () => {
      repo.getProfileById.mockResolvedValue(null);
      await expect(service.deleteProfile('p1', 'a1')).rejects.toThrow(/学习档案不存在/);
    });

    it('rejects default profile', async () => {
      repo.getProfileById.mockResolvedValue(mockProfile({ is_default: true }));
      await expect(service.deleteProfile('p1', 'a1')).rejects.toThrow(/不能删除默认学习档案/);
    });

    it('deletes non-default', async () => {
      repo.getProfileById.mockResolvedValue(mockProfile({ is_default: false }));
      await service.deleteProfile('p1', 'a1');
      expect(repo.deleteProfile).toHaveBeenCalledWith('p1', 'a1');
    });
  });
});
