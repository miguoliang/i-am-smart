import { AccountRepository } from '@/lib/repositories/account.repository';
import { KnowledgeRepository } from '@/lib/repositories/knowledge.repository';
import { ApiError } from '@/lib/utils/apiErrorClasses';

export interface Account {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

export interface DistributeCardsResult {
  success: boolean;
  count: number;
  message: string;
}

export class AccountService {
  constructor(
    private accountRepository: AccountRepository,
    private knowledgeRepository: KnowledgeRepository
  ) {}

  /**
   * List users with pagination using Admin API
   */
  async listUsers(page: number = 1, perPage: number = 10): Promise<PaginationResult<Account>> {
    const { users, hasMore } = await this.accountRepository.listUsers(page, perPage);

    return {
      data: users,
      pagination: {
        page,
        perPage,
        hasMore,
      },
    };
  }

  /**
   * Distribute all available knowledge cards to a specific user
   */
  async distributeCards(targetUserId: string): Promise<DistributeCardsResult> {
    // 1. Validate target user
    const targetUser = await this.accountRepository.getUserById(targetUserId);
    
    if (!targetUser) {
      throw ApiError.notFound("目标账户不存在");
    }

    if (targetUser.role === "operator") {
      throw ApiError.validationError("不能给 operator 分配卡片");
    }

    // 2. Get default card type
    const finalCardTypeCode = await this.accountRepository.getSystemDefaultCardTypeCode();

    if (!finalCardTypeCode) {
      throw ApiError.validationError("系统中没有可用的卡片类型，请先创建卡片类型");
    }

    // 3. Distribute via RPC
    const { count, skipped } = await this.accountRepository.distributeAllCards(targetUserId, finalCardTypeCode);

    if (count === 0 && skipped === 0) {
      throw ApiError.validationError("知识库中没有可分配的卡片");
    }

    return {
      success: true,
      count,
      message: `成功分配 ${count} 张卡片${skipped > 0 ? `（${skipped} 张已存在）` : ""}`,
    };
  }
}
