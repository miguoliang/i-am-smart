import { renderHook, act } from '@testing-library/react';
import { useCards } from './useCards';
import { Card } from '../types';

// Mock the dependencies with variables that can be updated
let mockDueCardsQueryReturn: any = {
  data: null,
  isLoading: true,
};
let mockLevelReturn: any = { level: 'A1' };

jest.mock('./useDueCardsQuery', () => ({
  useDueCardsQuery: jest.fn(() => mockDueCardsQueryReturn),
}));

jest.mock('./useLevel', () => ({
  useLevel: jest.fn(() => mockLevelReturn),
}));

describe('useCards', () => {
  const mockCards: Card[] = [
    { id: 1, front: 'Card 1', back: 'Answer 1', reviewed: false },
    { id: 2, front: 'Card 2', back: 'Answer 2', reviewed: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mocks - level must be set first
    mockLevelReturn = { level: 'A1' };
    mockDueCardsQueryReturn = {
      data: null,
      isLoading: true,
    };
  });

  describe('Initial State', () => {
    it('should initialize with empty cards when no data is available', () => {
      const { result } = renderHook(() => useCards());

      expect(result.current.cards).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.reviewedCount).toBe(0);
      expect(typeof result.current.setCards).toBe('function');
    });

  });

  describe('Level Changes', () => {
    it('should reset local cards when level changes', async () => {
      mockLevelReturn = { level: 'A1' };

      const { result, rerender } = renderHook(() => useCards());

      // Set some local cards
      act(() => {
        result.current.setCards([
          { ...mockCards[0], reviewed: true },
          { ...mockCards[1], reviewed: true },
        ]);
      });

      expect(result.current.cards).toHaveLength(2);

      // Change level
      mockLevelReturn = { level: 'A2' };
      rerender();

      // Wait for level change effect
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Cards should be reset
      expect(result.current.cards).toEqual([]);
    });

  });

  describe('Data Loading', () => {
  });

  describe('State Management', () => {
    it('should handle setCards with array', () => {
      const { result } = renderHook(() => useCards());

      const newCards = [
        { ...mockCards[0], reviewed: true },
        { ...mockCards[1], reviewed: true },
      ];

      act(() => {
        result.current.setCards(newCards);
      });

      expect(result.current.cards).toEqual(newCards);
    });


    it('should handle setCards with null to clear local cards', () => {
      const { result } = renderHook(() => useCards());

      // Set some cards
      act(() => {
        result.current.setCards(mockCards);
      });
      expect(result.current.cards).toHaveLength(2);

      // Clear cards
      act(() => {
        result.current.setCards(null);
      });
      expect(result.current.cards).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle loading state changes', () => {
      mockDueCardsQueryReturn = {
        data: null,
        isLoading: true,
      };

      const { result, rerender } = renderHook(() => useCards());

      expect(result.current.loading).toBe(true);

      mockDueCardsQueryReturn = {
        data: null,
        isLoading: false,
      };
      rerender();

      expect(result.current.loading).toBe(false);
    });

    it('should handle undefined data gracefully', () => {
      mockDueCardsQueryReturn = {
        data: undefined,
        isLoading: false,
      };

      const { result } = renderHook(() => useCards());

      expect(result.current.cards).toEqual([]);
      expect(result.current.reviewedCount).toBe(0);
    });

    it('should handle data with empty cards array', () => {
      mockDueCardsQueryReturn = {
        data: {
          cards: [],
          reviewedCount: 0,
        },
        isLoading: false,
      };

      const { result } = renderHook(() => useCards());

      expect(result.current.cards).toEqual([]);
      expect(result.current.reviewedCount).toBe(0);
    });
  });
});