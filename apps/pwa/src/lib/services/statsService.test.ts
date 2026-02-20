/**
 * @jest-environment node
 */
import { StatsService } from './statsService';
import { StatsRepository } from '@/lib/repositories/stats.repository';

describe('StatsService', () => {
  let service: StatsService;
  let mockRepo: jest.Mocked<StatsRepository>;

  beforeEach(() => {
    mockRepo = {
      getUserStats: jest.fn(),
      getReviewHeatmap: jest.fn(),
    };
    service = new StatsService(mockRepo);
  });

  it('should aggregate stats and heatmap correctly', async () => {
    const mockStats = {
      total: 100,
      mastered: 20,
      learning: 30,
      dueToday: 10,
    };
    const mockHeatmap = [
      { date: '2023-01-01', count: 5 },
      { date: '2023-01-02', count: 8 },
    ];

    mockRepo.getUserStats.mockResolvedValue(mockStats);
    mockRepo.getReviewHeatmap.mockResolvedValue(mockHeatmap);

    const result = await service.getStats('profile-1', -480);

    expect(mockRepo.getUserStats).toHaveBeenCalledWith('profile-1');
    expect(mockRepo.getReviewHeatmap).toHaveBeenCalledWith('profile-1', -480);
    expect(result).toEqual({
      stats: mockStats,
      heatmap: mockHeatmap,
    });
  });

  it('should propagate errors from repository', async () => {
    mockRepo.getUserStats.mockRejectedValue(new Error('DB Error'));

    await expect(service.getStats('profile-1', 0)).rejects.toThrow('DB Error');
  });
});
