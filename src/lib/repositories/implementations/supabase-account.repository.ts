import { SupabaseClient } from '@supabase/supabase-js';
import { AccountRepository, CardDistribution } from '../account.repository';
import { Account } from '@/lib/services/accountService';

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private adminClient: SupabaseClient) {}

  async listUsers(page: number, perPage: number): Promise<{ users: Account[]; hasMore: boolean }> {
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

    const users = usersResponse.users.map((u) => ({
      id: u.id,
      username: u.user_metadata?.username || u.email?.split("@")[0] || u.id.substring(0, 8),
      email: u.email || "",
      role: (u.app_metadata?.role as string)?.trim() || "learner",
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
    }));

    const hasMore = usersResponse.users.length === perPage;

    return { users, hasMore };
  }

  async getUserById(userId: string): Promise<Account | null> {
    const { data, error } = await this.adminClient.auth.admin.getUserById(userId);
    
    if (error || !data || !data.user) {
      return null;
    }

    const u = data.user;
    return {
      id: u.id,
      username: u.user_metadata?.username || u.email?.split("@")[0] || u.id.substring(0, 8),
      email: u.email || "",
      role: (u.app_metadata?.role as string)?.trim() || "learner",
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
    };
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