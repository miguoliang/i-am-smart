import { CardService } from './cardService';
import { CardRepository } from '@/lib/repositories/card.repository';
import { Card } from '@/app/learn/types';

describe('CardService', () => {
  let cardRepository: jest.Mocked<CardRepository>;
  let cardService: CardService;

  // Helper function to create properly typed mock cards
  const createMockCard = (overrides?: Partial<Card>): Card => ({
    id: 1,
    knowledge_code: 'k1',
    knowledge: {
      code: 'k1',
      name: 'n',
      description: 'd',
      metadata: {},
      pos: '',
      level: '',
      selfExaminePrompt: '',
      theme: '',
    },
    next_review_date: '2023-01-01',
    ease_factor: 2.5,
    repetitions: 0,
    interval_days: 0,
    last_reviewed_at: '2023-01-01T00:00:00Z', // Old date
    ...overrides,
  });

  beforeEach(() => {
    // Create a mock repository with jest functions
    cardRepository = {
      getReviewedTodayCount: jest.fn(),
      getDueCards: jest.fn(),
      getCardById: jest.fn(),
      reviewCard: jest.fn(),
    };
    cardService = new CardService(cardRepository);
  });

  describe('getReviewedTodayCount', () => {
    it('should return the count from repository', async () => {
      cardRepository.getReviewedTodayCount.mockResolvedValue(5);

      const count = await cardService.getReviewedTodayCount('profile-123');

      expect(count).toBe(5);
      expect(cardRepository.getReviewedTodayCount).toHaveBeenCalledWith(
        'profile-123', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });
  });

  describe('reviewCard', () => {
    it('should successfully review a card', async () => {
      const mockCard = createMockCard();
      cardRepository.getCardById.mockResolvedValue(mockCard);
      cardRepository.reviewCard.mockResolvedValue();

      const result = await cardService.reviewCard('profile-123', 1, 5);

      expect(result.success).toBe(true);
      expect(cardRepository.reviewCard).toHaveBeenCalledWith(expect.objectContaining({
        cardId: 1,
        profileId: 'profile-123',
        quality: 5,
        repetitions: 1,
        intervalDays: 1,
      }));
    });

    it('should allow review regardless of how many reviews done today', async () => {
       const mockCard = createMockCard();
       cardRepository.getCardById.mockResolvedValue(mockCard);
       cardRepository.reviewCard.mockResolvedValue();

       // Even with many reviews today, should still succeed (no daily limit)
       const result = await cardService.reviewCard('profile-123', 1, 5);
       expect(result.success).toBe(true);
    });

    it('should throw NotFound if card does not exist', async () => {
        cardRepository.getCardById.mockResolvedValue(null);

        await expect(
            cardService.reviewCard('profile-123', 999, 5)
        ).rejects.toThrow(/卡片不存在/);
    });
  });

  describe('getDueCards', () => {
      it('should fetch all due cards without limit', async () => {
          const mockCard = createMockCard();
          cardRepository.getReviewedTodayCount.mockResolvedValue(10);
          cardRepository.getDueCards.mockResolvedValue([mockCard]);

          const result = await cardService.getDueCards('profile-123');

          expect(result.reviewedCount).toBe(10);
          expect(result.cards).toHaveLength(1);
          expect(cardRepository.getDueCards).toHaveBeenCalledWith('profile-123', 9999, undefined);
      });

      it('should fetch due cards with single level filter', async () => {
          const mockCard = createMockCard();
          cardRepository.getReviewedTodayCount.mockResolvedValue(5);
          cardRepository.getDueCards.mockResolvedValue([mockCard]);

          const result = await cardService.getDueCards('profile-123', ['A1']);

          expect(result.reviewedCount).toBe(5);
          expect(result.cards).toHaveLength(1);
          expect(cardRepository.getDueCards).toHaveBeenCalledWith('profile-123', 9999, 'A1');
      });

      it('should fetch due cards with multiple levels and deduplicate', async () => {
          const card1 = createMockCard({ id: 1 });
          const card2 = createMockCard({ id: 2 });
          const card1Dup = createMockCard({ id: 1 }); // duplicate
          cardRepository.getReviewedTodayCount.mockResolvedValue(3);
          cardRepository.getDueCards
            .mockResolvedValueOnce([card1, card2])
            .mockResolvedValueOnce([card1Dup]);

          const result = await cardService.getDueCards('profile-123', ['A1', 'A2']);

          expect(result.reviewedCount).toBe(3);
          expect(result.cards).toHaveLength(2);
          expect(cardRepository.getDueCards).toHaveBeenCalledTimes(2);
      });
  });
});
