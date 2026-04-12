import { SupabaseClient, User } from '@supabase/supabase-js';
import { AccountRepository } from '../account.repository';
import { Account } from '@/lib/services/accountService';
import { logger } from '@/lib/utils/logger';

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private adminClient: SupabaseClient) {}

  /** Merge DB `accounts.plan` and default profile `exam_target` into listed users. */
  private async enrichUsersWithDbFields(users: Account[]): Promise<Account[]> {
    if (users.length === 0) return users;
    const ids = users.map((u) => u.id);

    const [accountsRes, profilesRes] = await Promise.all([
      this.adminClient.from('accounts').select('id, plan').in('id', ids),
      this.adminClient
        .from('learner_profiles')
        .select('account_id, exam_target')
        .in('account_id', ids)
        .eq('is_default', true),
    ]);

    if (accountsRes.error) {
      logger.error('enrichUsersWithDbFields: accounts query failed', { message: accountsRes.error.message });
    }
    if (profilesRes.error) {
      logger.error('enrichUsersWithDbFields: learner_profiles query failed', {
        message: profilesRes.error.message,
      });
    }

    const planMap = new Map(
      (accountsRes.data ?? []).map((r: { id: string; plan: string }) => [r.id, r.plan as 'free' | 'pro'])
    );
    const examMap = new Map(
      (profilesRes.data ?? []).map((r: { account_id: string; exam_target: string | null }) => [
        r.account_id,
        r.exam_target,
      ])
    );

    return users.map((u) => ({
      ...u,
      plan: planMap.get(u.id) ?? 'free',
      exam_target: examMap.get(u.id) ?? null,
    }));
  }

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

      const users = await this.enrichUsersWithDbFields(
        usersResponse.users.map((u) => this.mapAuthUserToAccount(u))
      );
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
    const pageSlice = allFetched.slice(start, start + perPage);
    const users = await this.enrichUsersWithDbFields(pageSlice);
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
}