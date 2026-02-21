import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCardRepository } from '@/lib/repositories/implementations/supabase-card.repository';
import { SupabaseAccountRepository } from '@/lib/repositories/implementations/supabase-account.repository';
import { SupabaseKnowledgeRepository } from '@/lib/repositories/implementations/supabase-knowledge.repository';
import { SupabaseFeedbackRepository } from '@/lib/repositories/implementations/supabase-feedback.repository';
import { SupabaseStatsRepository } from '@/lib/repositories/implementations/supabase-stats.repository';
import { SupabaseProfileRepository } from '@/lib/repositories/implementations/supabase-profile.repository';
import { CardService } from './cardService';
import { AccountService } from './accountService';
import { KnowledgeService } from './knowledgeService';
import { FeedbackService } from './feedbackService';
import { StatsService } from './statsService';
import { ProfileService } from './profileService';

/**
 * Resolve a Supabase user-context client: reuse if provided, otherwise create from request.
 */
async function resolveClient(reqOrClient?: NextRequest | SupabaseClient): Promise<SupabaseClient> {
  if (reqOrClient && 'auth' in reqOrClient && 'from' in reqOrClient) {
    return reqOrClient as SupabaseClient;
  }
  return createRouteHandlerClient(reqOrClient as NextRequest | undefined);
}

/**
 * Factory for CardService
 * Uses Route Handler Client (User Context)
 * @param reqOrClient - NextRequest or existing SupabaseClient to reuse
 */
export async function createCardService(reqOrClient?: NextRequest | SupabaseClient): Promise<CardService> {
  const supabase = await resolveClient(reqOrClient);
  const repo = new SupabaseCardRepository(supabase);
  return new CardService(repo);
}

/**
 * Factory for KnowledgeService
 * Uses Route Handler Client (User Context)
 * @param reqOrClient - NextRequest or existing SupabaseClient to reuse
 */
export async function createKnowledgeService(reqOrClient?: NextRequest | SupabaseClient): Promise<KnowledgeService> {
  const supabase = await resolveClient(reqOrClient);
  const repo = new SupabaseKnowledgeRepository(supabase);
  return new KnowledgeService(repo);
}

/**
 * Factory for FeedbackService
 * Uses Route Handler Client (User Context)
 * @param reqOrClient - NextRequest or existing SupabaseClient to reuse
 */
export async function createFeedbackService(reqOrClient?: NextRequest | SupabaseClient): Promise<FeedbackService> {
  const supabase = await resolveClient(reqOrClient);
  const repo = new SupabaseFeedbackRepository(supabase);
  return new FeedbackService(repo);
}

/**
 * Factory for StatsService
 * Uses Route Handler Client (User Context)
 * @param reqOrClient - NextRequest or existing SupabaseClient to reuse
 */
export async function createStatsService(reqOrClient?: NextRequest | SupabaseClient): Promise<StatsService> {
  const supabase = await resolveClient(reqOrClient);
  const repo = new SupabaseStatsRepository(supabase);
  return new StatsService(repo);
}

/**
 * Factory for ProfileService
 * Uses Route Handler Client (User Context)
 * @param reqOrClient - NextRequest or existing SupabaseClient to reuse
 */
export async function createProfileService(reqOrClient?: NextRequest | SupabaseClient): Promise<ProfileService> {
  const supabase = await resolveClient(reqOrClient);
  const repo = new SupabaseProfileRepository(supabase);
  return new ProfileService(repo);
}

/**
 * Factory for AccountService
 * Uses Admin Client (Service Role)
 */
export function createAccountService(): AccountService {
  const adminClient = createSupabaseAdmin();
  const accountRepo = new SupabaseAccountRepository(adminClient);
  return new AccountService(accountRepo);
}
