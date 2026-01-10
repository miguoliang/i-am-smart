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
    knowledge: { code: 'k1', name: 'n', description: 'd', metadata: {} },
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

      const count = await cardService.getReviewedTodayCount('user-123');

      expect(count).toBe(5);
      expect(cardRepository.getReviewedTodayCount).toHaveBeenCalledWith(
        'user-123', 
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/), // ISO date format
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)  // ISO date format
      );
    });
  });

  describe('reviewCard', () => {
    it('should successfully review a card', async () => {
      // Setup
      const mockCard = createMockCard();
      cardRepository.getCardById.mockResolvedValue(mockCard);
      cardRepository.getReviewedTodayCount.mockResolvedValue(0);
      cardRepository.reviewCard.mockResolvedValue();

      // Execute
      const result = await cardService.reviewCard('user-123', 1, 5); // Quality 5

      // Assert
      expect(result.success).toBe(true);
      expect(cardRepository.reviewCard).toHaveBeenCalledWith(expect.objectContaining({
        cardId: 1,
        userId: 'user-123',
        quality: 5,
        repetitions: 1, // 0 -> 1
        intervalDays: 1, // 0 -> 1
      }));
    });

    it('should throw ApiError if daily limit is exceeded', async () => {
       const mockCard = createMockCard();
       cardRepository.getCardById.mockResolvedValue(mockCard);
       cardRepository.getReviewedTodayCount.mockResolvedValue(10); // Limit reached

       await expect(
         cardService.reviewCard('user-123', 1, 5)
       ).rejects.toThrow(/今日已复习/);
    });

    it('should NOT check daily limit if card was already reviewed today', async () => {
        const todayCard = createMockCard({
          last_reviewed_at: new Date().toISOString() // Reviewed just now
        });
        
        cardRepository.getCardById.mockResolvedValue(todayCard);
        cardRepository.reviewCard.mockResolvedValue();
        
        await cardService.reviewCard('user-123', 1, 4);

        // Should NOT have called count check because it's a re-review
        expect(cardRepository.getReviewedTodayCount).not.toHaveBeenCalled(); 
        expect(cardRepository.reviewCard).toHaveBeenCalled();
    });

    it('should throw NotFound if card does not exist', async () => {
        cardRepository.getCardById.mockResolvedValue(null);

        await expect(
            cardService.reviewCard('user-123', 999, 5)
        ).rejects.toThrow(/卡片不存在/);
    });
  });

  describe('getDueCards', () => {
      it('should return empty list if daily limit reached', async () => {
          cardRepository.getReviewedTodayCount.mockResolvedValue(10); // Limit

          const result = await cardService.getDueCards('user-123');

          expect(result.reviewedCount).toBe(10);
          expect(result.cards).toEqual([]);
          expect(cardRepository.getDueCards).not.toHaveBeenCalled();
      });

      it('should fetch due cards with remaining limit', async () => {
          const mockCard = createMockCard();
          cardRepository.getReviewedTodayCount.mockResolvedValue(5);
          cardRepository.getDueCards.mockResolvedValue([mockCard]);

          const result = await cardService.getDueCards('user-123');

          expect(result.reviewedCount).toBe(5);
          expect(result.cards).toHaveLength(1);
          // Limit is 10. Reviewed 5. Remaining 5. Level is optional (undefined).
          expect(cardRepository.getDueCards).toHaveBeenCalledWith('user-123', 5, undefined);
      });

      it('should fetch due cards with level filter', async () => {
          const mockCard = createMockCard();
          cardRepository.getReviewedTodayCount.mockResolvedValue(5);
          cardRepository.getDueCards.mockResolvedValue([mockCard]);

          const result = await cardService.getDueCards('user-123', 'A1');

          expect(result.reviewedCount).toBe(5);
          expect(result.cards).toHaveLength(1);
          expect(cardRepository.getDueCards).toHaveBeenCalledWith('user-123', 5, 'A1');
      });
  });
});