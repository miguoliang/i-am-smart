import { renderHook, act } from '@testing-library/react';
import { useSpeech } from './useSpeech';

describe('useSpeech', () => {
  const mockSpeak = jest.fn();
  const mockCancel = jest.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        speak: mockSpeak,
        cancel: mockCancel,
      },
      writable: true,
    });
    
    // Mock SpeechSynthesisUtterance
    global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
      text,
      lang: '',
      rate: 1,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should attach speak function to window on mount', () => {
    renderHook(() => useSpeech());
    expect(window.speak).toBeDefined();
    expect(typeof window.speak).toBe('function');
  });

  it('should call speechSynthesis.speak when window.speak is called', () => {
    renderHook(() => useSpeech());
    
    act(() => {
      window.speak('Hello', 'en-US');
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Hello');
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('should cleanup window.speak on unmount', () => {
    const { unmount } = renderHook(() => useSpeech());
    unmount();
    expect(window.speak).toBeUndefined();
  });
});
