import { AccountRepository } from '@/lib/repositories/account.repository';

export interface Account {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  banned_until?: string | null;
  dailyReviewCount?: number;
  /** From `public.accounts.plan` */
  plan?: 'free' | 'pro';
  /** Default learner profile's `exam_target` (词库档位) */
  exam_target?: string | null;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

export class AccountService {
  constructor(
    private accountRepository: AccountRepository,
  ) {}

  /**
   * List users with pagination using Admin API.
   * Optional search filters by username or email (server-side filter over listed users; auth API has no native search).
   */
  async listUsers(
    page: number = 1,
    perPage: number = 10,
    search?: string
  ): Promise<PaginationResult<Account>> {
    const [userResult, reviewCounts] = await Promise.all([
      this.accountRepository.listUsers(page, perPage, search),
      this.accountRepository.getAccountsDailyReviewCounts(),
    ]);

    const { users, hasMore } = userResult;

    // Create a map of account ID to review count for efficient lookup
    const reviewCountMap = new Map(
      reviewCounts.map(rc => [rc.accountId, rc.reviewCount])
    );

    // Add daily review count to each user
    const usersWithReviewCounts = users.map(user => ({
      ...user,
      dailyReviewCount: reviewCountMap.get(user.id) || 0,
    }));

    return {
      data: usersWithReviewCounts,
      pagination: {
        page,
        perPage,
        hasMore,
      },
    };
  }
}
