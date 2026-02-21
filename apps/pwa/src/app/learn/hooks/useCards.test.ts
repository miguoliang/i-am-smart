import { renderHook, act } from '@testing-library/react';
import { useCards } from './useCards';
import { Card } from '../types';
import type { DueCardsResponse } from '@/lib/api/cards';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Level } from '@i-am-smart/shared/constants';

// Mock the dependencies with variables that can be updated
let mockDueCardsQueryReturn: Partial<UseQueryResult<DueCardsResponse, Error>> = {
  data: undefined,
  isLoading: true,
};
let mockProfileReturn: { activeProfile: { id: string; level: Level } | null } = {
  activeProfile: { id: 'profile-1', level: 'A1' },
};

jest.mock('./useDueCardsQuery', () => ({
  useDueCardsQuery: jest.fn(() => mockDueCardsQueryReturn),
}));

jest.mock('@/hooks/useProfile', () => ({
  useProfile: jest.fn(() => mockProfileReturn),
}));

describe('useCards', () => {
  const mockCards: Card[] = [
    { 
      id: 1, 
      knowledge_code: 'test1',
      knowledge: { code: 'test1', name: 'Test 1', description: 'Test knowledge 1', metadata: {} },
      next_review_date: '2024-01-01',
      reviewed: false 
    },
    { 
      id: 2, 
      knowledge_code: 'test2',
      knowledge: { code: 'test2', name: 'Test 2', description: 'Test knowledge 2', metadata: {} },
      next_review_date: '2024-01-02',
      reviewed: false 
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileReturn = { activeProfile: { id: 'profile-1', level: 'A1' } };
    mockDueCardsQueryReturn = {
      data: undefined,
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
      mockProfileReturn = { activeProfile: { id: 'profile-1', level: 'A1' } };

      const { result, rerender } = renderHook(() => useCards());

      // Set some local cards
      act(() => {
        result.current.setCards([
          { ...mockCards[0], reviewed: true },
          { ...mockCards[1], reviewed: true },
        ]);
      });

      expect(result.current.cards).toHaveLength(2);

      // Change level via profile
      mockProfileReturn = { activeProfile: { id: 'profile-1', level: 'A2' } };
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
        data: undefined,
        isLoading: true,
      };

      const { result, rerender } = renderHook(() => useCards());

      expect(result.current.loading).toBe(true);

      mockDueCardsQueryReturn = {
        data: undefined,
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
