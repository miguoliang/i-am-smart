import { SupabaseClient, User } from '@supabase/supabase-js';
import { AccountRepository, CardDistribution } from '../account.repository';
import { Account } from '@/lib/services/accountService';

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private adminClient: SupabaseClient) {}

  /**
   * List users with optional search. Note: Supabase auth.admin.listUsers does not
   * support server-side search by username/email. When search is provided we
   * fetch up to SEARCH_MAX_PAGES of users and filter client-side (in this process).
   */
  async listUsers(
    page: number,
    perPage: number,
    search?: string
  ): Promise<{ users: Account[]; hasMore: boolean }> {
    const searchTerm = search?.trim().toLowerCase();
    const SEARCH_MAX_PAGES = 20;
    const PAGE_SIZE = 100;

    if (!searchTerm) {
      const { data: usersResponse, error } = await this.adminClient.auth.admin.listUsers({
        page,
        perPage,
      });

      if (error) {
        throw new Error(`List users failed: ${error.message}`);
      }

      if (!usersResponse || !usersResponse.users) {
        throw new Error("无法获取用户列表");
      }

      const users = usersResponse.users.map((u) => this.mapAuthUserToAccount(u));
      const hasMore = usersResponse.users.length === perPage;
      return { users, hasMore };
    }

    const allFetched: Account[] = [];
    let hasMorePages = true;
    let currentPage = 1;

    while (hasMorePages && currentPage <= SEARCH_MAX_PAGES) {
      const { data: usersResponse, error } = await this.adminClient.auth.admin.listUsers({
        page: currentPage,
        perPage: PAGE_SIZE,
      });

      if (error) {
        throw new Error(`List users failed: ${error.message}`);
      }
      if (!usersResponse?.users?.length) {
        break;
      }

      const batch = usersResponse.users.map((u) => this.mapAuthUserToAccount(u));
      const matched = batch.filter(
        (u) =>
          u.username.toLowerCase().includes(searchTerm) ||
          (u.email && u.email.toLowerCase().includes(searchTerm))
      );
      allFetched.push(...matched);
      hasMorePages = usersResponse.users.length === PAGE_SIZE;
      currentPage++;
    }

    const start = (page - 1) * perPage;
    const users = allFetched.slice(start, start + perPage);
    const hasMore = allFetched.length > start + perPage;

    return { users, hasMore };
  }

  private mapAuthUserToAccount(u: User): Account {
    return {
      id: u.id,
      username: u.user_metadata?.username || u.email?.split("@")[0] || u.id.substring(0, 8),
      email: u.email || "",
      role: (u.app_metadata?.role as string)?.trim() || "learner",
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      banned_until: (u as User & { banned_until?: string | null }).banned_until ?? null,
    };
  }

  async getUserById(userId: string): Promise<Account | null> {
    const { data, error } = await this.adminClient.auth.admin.getUserById(userId);
    
    if (error || !data || !data.user) {
      return null;
    }

    return this.mapAuthUserToAccount(data.user);
  }

  async getAccountsDailyReviewCounts(): Promise<{ accountId: string; reviewCount: number }[]> {
    const { data, error } = await this.adminClient
      .rpc('get_accounts_daily_review_counts');

    if (error) {
      throw new Error(`获取每日复习统计失败: ${error.message}`);
    }

    return (data || []).map((row: { account_id: string; review_count: number }) => ({
      accountId: row.account_id,
      reviewCount: Number(row.review_count),
    }));
  }

  async getSystemDefaultCardTypeCode(): Promise<string | null> {
    const { data, error } = await this.adminClient
      .from("card_types")
      .select("code")
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }
    return data[0].code;
  }

  async distributeCards(userId: string, cards: CardDistribution[]): Promise<{ count: number; skipped: number }> {
     const { data: insertedData, error } = await this.adminClient
      .from("account_cards")
      .upsert(cards.map(c => ({
        account_id: c.accountId,
        knowledge_code: c.knowledgeCode,
        card_type_code: c.cardTypeCode,
        ease_factor: c.easeFactor,
        interval_days: c.intervalDays,
        repetitions: c.repetitions,
        next_review_date: c.nextReviewDate,
        created_at: c.createdAt,
        updated_at: c.updatedAt
      })), {
        onConflict: "account_id,knowledge_code,card_type_code",
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      throw new Error(`分配卡片失败: ${error.message}`);
    }

    const count = insertedData?.length || 0;
    const skipped = cards.length - count;

    return { count, skipped };
  }

  async distributeAllCards(userId: string, cardTypeCode: string): Promise<{ count: number; skipped: number }> {
    const { data, error } = await this.adminClient.rpc('distribute_all_cards', {
      p_user_id: userId,
      p_card_type_code: cardTypeCode,
    });

    if (error) {
      throw new Error(`批量分配卡片失败: ${error.message}`);
    }

    // Cast the returned JSON
    const result = data as { inserted: number; skipped: number };
    return { count: result.inserted, skipped: result.skipped };
  }
}