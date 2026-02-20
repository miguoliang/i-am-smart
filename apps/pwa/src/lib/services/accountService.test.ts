/**
 * @jest-environment node
 */
import { AccountService, Account } from './accountService';
import { AccountRepository } from '@/lib/repositories/account.repository';
import { KnowledgeRepository } from '@/lib/repositories/knowledge.repository';
import { ApiError } from '@/lib/utils/apiErrorClasses';

describe('AccountService', () => {
  let service: AccountService;
  let mockAccountRepo: jest.Mocked<AccountRepository>;
  let mockKnowledgeRepo: jest.Mocked<KnowledgeRepository>;

  beforeEach(() => {
    mockAccountRepo = {
      listUsers: jest.fn(),
      getUserById: jest.fn(),
      getAccountsDailyReviewCounts: jest.fn(),
      distributeCards: jest.fn(),
      distributeAllCards: jest.fn(),
      getSystemDefaultCardTypeCode: jest.fn(),
    };
    mockKnowledgeRepo = {
      getAll: jest.fn(),
      getPaginated: jest.fn(),
      import: jest.fn(),
    };
    service = new AccountService(mockAccountRepo, mockKnowledgeRepo);
  });

  describe('distributeCards', () => {
    it('should successfully distribute cards using RPC', async () => {
      const mockUser = { id: 'user-1', role: 'learner' } as Account;
      mockAccountRepo.getUserById.mockResolvedValue(mockUser);
      mockAccountRepo.getSystemDefaultCardTypeCode.mockResolvedValue('card-type-1');
      mockAccountRepo.distributeAllCards.mockResolvedValue({ count: 10, skipped: 5 });

      const result = await service.distributeCards('user-1');

      expect(mockAccountRepo.getUserById).toHaveBeenCalledWith('user-1');
      expect(mockAccountRepo.getSystemDefaultCardTypeCode).toHaveBeenCalled();
      expect(mockAccountRepo.distributeAllCards).toHaveBeenCalledWith('user-1', 'card-type-1');
      expect(result).toEqual({
        success: true,
        count: 10,
        message: '成功分配 10 张卡片（5 张已存在）',
      });
    });

    it('should throw error if user not found', async () => {
      mockAccountRepo.getUserById.mockResolvedValue(null);

      await expect(service.distributeCards('user-1'))
        .rejects.toThrow(ApiError.notFound("目标账户不存在"));
    });

    it('should throw error if user is operator', async () => {
      const mockUser = { id: 'user-1', role: 'operator' } as Account;
      mockAccountRepo.getUserById.mockResolvedValue(mockUser);

      await expect(service.distributeCards('user-1'))
        .rejects.toThrow("不能给 operator 分配卡片");
    });

    it('should throw error if no default card type', async () => {
      const mockUser = { id: 'user-1', role: 'learner' } as Account;
      mockAccountRepo.getUserById.mockResolvedValue(mockUser);
      mockAccountRepo.getSystemDefaultCardTypeCode.mockResolvedValue(null);

      await expect(service.distributeCards('user-1'))
        .rejects.toThrow("系统中没有可用的卡片类型");
    });

    it('should throw error if no cards distributed (empty knowledge base)', async () => {
      const mockUser = { id: 'user-1', role: 'learner' } as Account;
      mockAccountRepo.getUserById.mockResolvedValue(mockUser);
      mockAccountRepo.getSystemDefaultCardTypeCode.mockResolvedValue('card-type-1');
      mockAccountRepo.distributeAllCards.mockResolvedValue({ count: 0, skipped: 0 });

      await expect(service.distributeCards('user-1'))
        .rejects.toThrow("知识库中没有可分配的卡片");
    });
  });
});
