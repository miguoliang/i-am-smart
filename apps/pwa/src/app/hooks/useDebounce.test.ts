import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 300 });

    // Should still be initial value (not debounced yet)
    expect(result.current).toBe('initial');

    // Fast-forward time by 299ms (not enough)
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Fast-forward remaining 1ms
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should use custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    rerender({ value: 'updated', delay: 500 });

    // Fast-forward 499ms (not enough)
    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    // Fast-forward remaining 1ms
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    // Rapid changes
    rerender({ value: 'change1', delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'change2', delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'change3', delay: 300 });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should still be initial (none of the changes have debounced)
    expect(result.current).toBe('initial');

    // Fast-forward remaining time
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should be the last value
    expect(result.current).toBe('change3');
  });

  it('should handle number values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    rerender({ value: 100, delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(100);
  });

  it('should handle object values', () => {
    const initialObj = { name: 'initial' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 300 },
      }
    );

    rerender({ value: updatedObj, delay: 300 });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(updatedObj);
    expect(result.current.name).toBe('updated');
  });

  it('should cleanup timeout on unmount', () => {
    const { unmount } = renderHook(() => useDebounce('value', 300));

    // Should not throw when unmounting with pending timeout
    expect(() => {
      unmount();
      jest.advanceTimersByTime(300);
    }).not.toThrow();
  });

  it('should use default delay of 300ms when not provided', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      {
        initialProps: { value: 'initial' },
      }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('updated');
  });
});