# Dependency Inversion Principle (DIP) Improvement Plan

**Date:** 2025-01-03  
**Status:** Completed  
**Priority:** Medium  
**Estimated Effort:** 2 days (Reduced from 3)

## Executive Summary

This plan addresses the DIP violation where services are tightly coupled to Supabase's `SupabaseClient` type. The refactoring will introduce **Repository Interfaces** for domain data access. Services will depend on these interfaces.

**Refinement Note:** Based on architectural review, we will **skip** creating a generic "Database Driver" abstraction (wrapping query builders). Instead, Concrete Repositories (e.g., `SupabaseCardRepository`) will depend directly on `SupabaseClient`. This simplifies the implementation, retains type safety, and still achieves 100% decoupling for the Service layer.

---

## Current State Analysis

### Current Architecture

```
API Routes → Services → SupabaseClient (concrete dependency)
```

**Issues:**
1. Services directly depend on `SupabaseClient` from `@supabase/supabase-js`.
2. Services use Supabase-specific APIs (`.from()`, `.rpc()`).
3. Testing requires complex Supabase client mocking.
4. Business logic is coupled to data access implementation details.

### Affected Services

1. **`cardService.ts`**
2. **`accountService.ts`**
3. **`knowledgeService.ts`**

---

## Target Architecture

### Proposed Structure

```
API Routes 
   ↓
Factories (inject dependencies)
   ↓
Services (Business Logic)
   ↓ depends on
Repository Interfaces (Domain Contracts)
   ↑ implements
Supabase Repositories (Data Access)
   ↓ depends on
Supabase SDK (Concrete Driver)
```

### Benefits

1. **Testability**: Services can be tested with simple mock repositories (POJOs).
2. **Decoupling**: Business logic knows nothing about Supabase, SQL, or HTTP calls.
3. **Simplicity**: Concrete repositories utilize the full power and type safety of the Supabase SDK without leaky abstractions.

---

## Implementation Plan

### Phase 1: Define Domain Repository Interfaces

**Goal:** Create clean interfaces that define *what* data operations the domain needs, not *how* they are performed.

**File:** `src/lib/repositories/card.repository.ts`

```typescript
import { Card } from '@/app/learn/types';

export interface CardRepository {
  getReviewedTodayCount(userId: string, startDate: string, endDate: string): Promise<number>;
  getDueCards(userId: string, limit: number): Promise<Card[]>;
  getCardById(cardId: number, userId: string): Promise<Card | null>;
  reviewCard(params: ReviewCardParams): Promise<void>;
}

export interface ReviewCardParams {
  cardId: number;
  userId: string;
  quality: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
}
```

**File:** `src/lib/repositories/account.repository.ts`

```typescript
import { Account } from '@/lib/services/accountService';

export interface AccountRepository {
  listUsers(page: number, perPage: number): Promise<{ users: Account[]; hasMore: boolean }>;
  getUserById(userId: string): Promise<Account | null>;
  distributeCards(userId: string, cards: CardDistribution[]): Promise<{ count: number; skipped: number }>;
}

export interface CardDistribution {
  accountId: string;
  knowledgeCode: string;
  cardTypeCode: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}
```

**File:** `src/lib/repositories/knowledge.repository.ts`

```typescript
import { KnowledgeItem, ImportKnowledgeParams } from '@/lib/services/knowledgeService';

export interface KnowledgeRepository {
  getAll(): Promise<KnowledgeItem[]>;
  import(items: ImportKnowledgeParams[]): Promise<{ count: number; skipped: number }>;
}
```

**Estimated Time:** 2-3 hours

---

### Phase 2: Implement Supabase Repositories

**Goal:** Create concrete classes that implement the interfaces using the Supabase SDK.

**File:** `src/lib/repositories/implementations/supabase-card.repository.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { CardRepository, ReviewCardParams } from '../card.repository';
import { Card } from '@/app/learn/types';

export class SupabaseCardRepository implements CardRepository {
  // Directly use SupabaseClient here. 
  // We don't hide it, because this class IS the Supabase implementation.
  constructor(private client: SupabaseClient) {}

  async getReviewedTodayCount(userId: string, startDate: string, endDate: string): Promise<number> {
    const { count, error } = await this.client
      .from('account_cards')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userId)
      .gte('last_reviewed_at', startDate)
      .lte('last_reviewed_at', endDate);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  async getDueCards(userId: string, limit: number): Promise<Card[]> {
    const { data, error } = await this.client
      .rpc('get_due_cards', { p_user_id: userId, p_limit: limit })
      .select(`
        id,
        knowledge_code,
        // ... selection fields
      `);

    if (error) throw new Error(error.message);
    return data as Card[];
  }

  // ... implement other methods using this.client
}
```

**File:** `src/lib/repositories/implementations/supabase-account.repository.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { AccountRepository } from '../account.repository';

export class SupabaseAccountRepository implements AccountRepository {
  constructor(private adminClient: SupabaseClient) {}

  async listUsers(page: number, perPage: number): Promise<{ users: Account[]; hasMore: boolean }> {
    const { data, error } = await this.adminClient.auth.admin.listUsers({ page, perPage });
    // ... logic
  }
}
```

**Estimated Time:** 6-8 hours

---

### Phase 3: Refactor Services

**Goal:** Services accept repositories in their constructor and use them.

**File:** `src/lib/services/cardService.ts`

```typescript
import { CardRepository } from '@/lib/repositories/card.repository';

export class CardService {
  constructor(private cardRepository: CardRepository) {}

  async getDueCards(userId: string) {
    // Pure business logic
    // Calls this.cardRepository.getDueCards(...)
  }
  
  // ...
}
```

**Estimated Time:** 4-6 hours

---

### Phase 4: Factory / Dependency Injection

**Goal:** Wire it all up in the API routes.

**File:** `src/lib/repositories/repository-factory.ts`

```typescript
import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';
import { SupabaseCardRepository } from './implementations/supabase-card.repository';
import { SupabaseAccountRepository } from './implementations/supabase-account.repository';

// Factory ensures we inject the correct Client into the correct Repository
export async function createCardRepository(): Promise<CardRepository> {
  const supabase = await createRouteHandlerClient();
  return new SupabaseCardRepository(supabase);
}

export async function createAccountRepository(): Promise<AccountRepository> {
  // ... env check ...
  const adminClient = createClient(..., ...);
  return new SupabaseAccountRepository(adminClient);
}
```

**Estimated Time:** 2 hours

---

## Success Criteria

1. ✅ Services depend **only** on interfaces defined in `src/lib/repositories/*.repository.ts`.
2. ✅ `SupabaseClient` is **never** imported in `src/lib/services/`.
3. ✅ Unit tests for Services allow mocking the repository interface easily (e.g., `const mockRepo = { getDueCards: jest.fn() }`).
4. ✅ Type safety is preserved within `SupabaseCardRepository` via Supabase generated types.

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Define Interfaces | 2-3 hours | None |
| Phase 2: Implement Repositories | 6-8 hours | Phase 1 |
| Phase 3: Refactor Services | 4-6 hours | Phase 2 |
| Phase 4: Factories & Wiring | 2 hours | Phase 3 |
| **Total** | **~2 Days** | |