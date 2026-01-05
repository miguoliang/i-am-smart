import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';
import { SupabaseCardRepository } from '@/lib/repositories/implementations/supabase-card.repository';
import { SupabaseAccountRepository } from '@/lib/repositories/implementations/supabase-account.repository';
import { SupabaseKnowledgeRepository } from '@/lib/repositories/implementations/supabase-knowledge.repository';
import { SupabaseFeedbackRepository } from '@/lib/repositories/implementations/supabase-feedback.repository';
import { SupabaseStatsRepository } from '@/lib/repositories/implementations/supabase-stats.repository';
import { CardService } from './cardService';
import { AccountService } from './accountService';
import { KnowledgeService } from './knowledgeService';
import { FeedbackService } from './feedbackService';
import { StatsService } from './statsService';

/**
 * Factory for CardService
 * Uses Route Handler Client (User Context)
 */
export async function createCardService(): Promise<CardService> {
  const supabase = await createRouteHandlerClient();
  const repo = new SupabaseCardRepository(supabase);
  return new CardService(repo);
}

/**
 * Factory for KnowledgeService
 * Uses Route Handler Client (User Context)
 */
export async function createKnowledgeService(): Promise<KnowledgeService> {
  const supabase = await createRouteHandlerClient();
  const repo = new SupabaseKnowledgeRepository(supabase);
  return new KnowledgeService(repo);
}

/**
 * Factory for FeedbackService
 * Uses Route Handler Client (User Context)
 */
export async function createFeedbackService(): Promise<FeedbackService> {
  const supabase = await createRouteHandlerClient();
  const repo = new SupabaseFeedbackRepository(supabase);
  return new FeedbackService(repo);
}

/**
 * Factory for StatsService
 * Uses Route Handler Client (User Context)
 */
export async function createStatsService(): Promise<StatsService> {
  const supabase = await createRouteHandlerClient();
  const repo = new SupabaseStatsRepository(supabase);
  return new StatsService(repo);
}

/**
 * Factory for AccountService
 * Uses Admin Client (Service Role)
 */
export function createAccountService(): AccountService {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const accountRepo = new SupabaseAccountRepository(adminClient);
  // AccountService uses knowledge repo for distribution. 
  // We reuse admin client here so it has permissions to read all knowledge.
  const knowledgeRepo = new SupabaseKnowledgeRepository(adminClient);
  
  return new AccountService(accountRepo, knowledgeRepo);
}
