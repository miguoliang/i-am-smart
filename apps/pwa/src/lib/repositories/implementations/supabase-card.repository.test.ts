import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCardRepository } from './supabase-card.repository';

function mockClient(partial: { from?: unknown; rpc?: unknown }): SupabaseClient {
  return partial as unknown as SupabaseClient;
}

const baseKnowledge = {
  code: 'k1',
  name: 'word',
  description: 'd',
  pos: 'n.',
  level: 'A1',
  self_examine_prompt: 'p',
  theme: 't',
  example_sentence: 'e',
  image_name: null as string | null,
};

const validCardRow = {
  id: 1,
  knowledge_code: 'k1',
  knowledge: baseKnowledge,
  next_review_date: '2024-01-01',
  last_reviewed_at: '2024-01-01T00:00:00Z',
  ease_factor: 2.5,
  interval_days: 1,
  repetitions: 0,
};

describe('SupabaseCardRepository', () => {
  describe('getReviewedTodayCount', () => {
    it('returns count when successful', async () => {
      const lte = jest.fn().mockResolvedValue({ count: 4, error: null });
      const gte = jest.fn(() => ({ lte }));
      const eq = jest.fn(() => ({ gte }));
      const client = mockClient({
        from: jest.fn(() => ({
          select: jest.fn(() => ({ eq })),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(
        repo.getReviewedTodayCount('prof', '2024-01-01', '2024-01-02')
      ).resolves.toBe(4);
    });

    it('throws when Supabase returns error', async () => {
      const lte = jest.fn().mockResolvedValue({
        count: null,
        error: { message: 'db fail' },
      });
      const gte = jest.fn(() => ({ lte }));
      const eq = jest.fn(() => ({ gte }));
      const client = mockClient({
        from: jest.fn(() => ({
          select: jest.fn(() => ({ eq })),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(
        repo.getReviewedTodayCount('prof', 'a', 'b')
      ).rejects.toThrow(/Count reviewed today error/);
    });

    it('returns 0 when count null', async () => {
      const lte = jest.fn().mockResolvedValue({ count: null, error: null });
      const gte = jest.fn(() => ({ lte }));
      const eq = jest.fn(() => ({ gte }));
      const client = mockClient({
        from: jest.fn(() => ({
          select: jest.fn(() => ({ eq })),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getReviewedTodayCount('p', 'a', 'b')).resolves.toBe(0);
    });
  });

  describe('getDueCards', () => {
    it('maps valid RPC rows', async () => {
      const client = mockClient({
        rpc: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [validCardRow],
            error: null,
          }),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      const cards = await repo.getDueCards('prof', 10, 'A1');
      expect(cards).toHaveLength(1);
      expect(cards[0]!.knowledge.code).toBe('k1');
    });

    it('returns empty array when data null', async () => {
      const client = mockClient({
        rpc: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getDueCards('prof', 10)).resolves.toEqual([]);
    });

    it('throws on RPC error', async () => {
      const client = mockClient({
        rpc: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: { message: 'rpc' },
          }),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getDueCards('prof', 10)).rejects.toThrow(/Fetch due cards error/);
    });

    it('throws when data is not array', async () => {
      const client = mockClient({
        rpc: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({ data: {}, error: null }),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getDueCards('prof', 10)).rejects.toThrow(/Expected array/);
    });

    it('throws when row fails schema', async () => {
      const client = mockClient({
        rpc: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [{ bad: true }],
            error: null,
          }),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getDueCards('prof', 10)).rejects.toThrow(/Invalid card data at index 0/);
    });
  });

  describe('getCardById', () => {
    it('returns null when error or no data', async () => {
      const single = jest.fn().mockResolvedValue({ data: null, error: { message: 'x' } });
      const chain = { eq: jest.fn().mockReturnThis(), single };
      const client = mockClient({
        from: jest.fn(() => ({
          select: jest.fn(() => chain),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getCardById(1, 'p')).resolves.toBeNull();
    });

    it('returns parsed card', async () => {
      const single = jest.fn().mockResolvedValue({ data: validCardRow, error: null });
      const chain = { eq: jest.fn().mockReturnThis(), single };
      const client = mockClient({
        from: jest.fn(() => ({
          select: jest.fn(() => chain),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      const card = await repo.getCardById(1, 'p');
      expect(card?.id).toBe(1);
    });

    it('throws when schema invalid', async () => {
      const single = jest.fn().mockResolvedValue({ data: { id: 'bad' }, error: null });
      const chain = { eq: jest.fn().mockReturnThis(), single };
      const client = mockClient({
        from: jest.fn(() => ({
          select: jest.fn(() => chain),
        })),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(repo.getCardById(1, 'p')).rejects.toThrow(/Invalid card data from database/);
    });
  });

  describe('reviewCard', () => {
    it('completes when no error', async () => {
      const client = mockClient({
        rpc: jest.fn().mockResolvedValue({ error: null }),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(
        repo.reviewCard({
          cardId: 1,
          profileId: 'p',
          quality: 5,
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 1,
          nextReviewDate: '2024-02-01',
        })
      ).resolves.toBeUndefined();
    });

    it('throws on error', async () => {
      const client = mockClient({
        rpc: jest.fn().mockResolvedValue({ error: { message: 'fail' } }),
      });
      const repo = new SupabaseCardRepository(client);
      await expect(
        repo.reviewCard({
          cardId: 1,
          profileId: 'p',
          quality: 5,
          easeFactor: 2.5,
          intervalDays: 1,
          repetitions: 1,
          nextReviewDate: '2024-02-01',
        })
      ).rejects.toThrow(/Review card error/);
    });
  });
});
