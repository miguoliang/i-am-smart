import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should initialize with initial seconds', () => {
      const { result } = renderHook(() => useCountdown(60));
      expect(result.current.seconds).toBe(60);
      expect(result.current.isActive).toBe(false);
    });

    it('should provide reset and start functions', () => {
      const { result } = renderHook(() => useCountdown(30));
      expect(typeof result.current.reset).toBe('function');
      expect(typeof result.current.start).toBe('function');
    });
  });

  describe('Starting Countdown', () => {
    it('should start countdown when start is called', () => {
      const { result } = renderHook(() => useCountdown(5));

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should decrement seconds when active', () => {
      const { result } = renderHook(() => useCountdown(5));

      act(() => {
        result.current.start();
      });

      expect(result.current.seconds).toBe(5);
      expect(result.current.isActive).toBe(true);

      // Advance 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(4);
      expect(result.current.isActive).toBe(true);
    });

    it('should continue counting down', () => {
      const { result } = renderHook(() => useCountdown(3));

      act(() => {
        result.current.start();
      });

      // Count down from 3 to 0
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.seconds).toBe(2);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.seconds).toBe(1);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.seconds).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Reset Function', () => {
    it('should reset to initial seconds and start', () => {
      const { result } = renderHook(() => useCountdown(10));

      act(() => {
        result.current.start();
      });

      // Count down a bit
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(result.current.seconds).toBe(7);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.seconds).toBe(10);
      expect(result.current.isActive).toBe(true);
    });

    it('should reset even when not active', () => {
      const { result } = renderHook(() => useCountdown(5));

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.seconds).toBe(5);
      expect(result.current.isActive).toBe(true);
    });
  });

  describe('onComplete Callback', () => {
    it('should call onComplete when countdown reaches 0', () => {
      const onComplete = jest.fn();
      const { result } = renderHook(() => useCountdown(2, onComplete));

      act(() => {
        result.current.start();
      });

      // Count down to 1
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onComplete).not.toHaveBeenCalled();

      // Count down to 0
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(result.current.seconds).toBe(0);
      expect(result.current.isActive).toBe(false);
    });

    it('should not call onComplete if callback is not provided', () => {
      const { result } = renderHook(() => useCountdown(1));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should complete without error
      expect(result.current.seconds).toBe(0);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should stop countdown when unmounted', () => {
      const { result, unmount } = renderHook(() => useCountdown(10));

      act(() => {
        result.current.start();
      });

      // Count down a bit
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.seconds).toBe(8);

      // Unmount
      unmount();

      // Advance time - should not cause errors
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    });

    it('should cleanup interval when countdown stops', () => {
      const { result } = renderHook(() => useCountdown(1));

      act(() => {
        result.current.start();
      });

      // Let it complete
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.seconds).toBe(0);

      // Advance more time - should not continue counting
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle initial seconds of 0', () => {
      const { result } = renderHook(() => useCountdown(0));

      expect(result.current.seconds).toBe(0);
      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.start();
      });

      // isActive will be true, but no interval will run (seconds > 0 check)
      expect(result.current.isActive).toBe(true);
      expect(result.current.seconds).toBe(0);

      // Advance time - should not change (no interval running)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(0);
      expect(result.current.isActive).toBe(true);
    });

    it('should handle rapid start/stop', () => {
      const { result } = renderHook(() => useCountdown(5));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.seconds).toBe(4);

      // Start again (should continue from current)
      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(result.current.seconds).toBe(3);
    });

    it('should handle reset during countdown', () => {
      const { result } = renderHook(() => useCountdown(10));

      act(() => {
        result.current.start();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(result.current.seconds).toBe(7);

      // Reset
      act(() => {
        result.current.reset();
      });
      expect(result.current.seconds).toBe(10);

      // Continue from reset point
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(result.current.seconds).toBe(8);
    });
  });
});