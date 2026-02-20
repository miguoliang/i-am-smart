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

  it('should return speak function', () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.speak).toBeDefined();
    expect(typeof result.current.speak).toBe('function');
  });

  it('should call speechSynthesis.speak when speak is called', () => {
    const { result } = renderHook(() => useSpeech());
    
    act(() => {
      result.current.speak('Hello', 'en-US');
    });

    expect(mockCancel).toHaveBeenCalled();
    expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Hello');
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('should handle default language parameter', () => {
    const { result } = renderHook(() => useSpeech());
    
    act(() => {
      result.current.speak('Hello');
    });

    expect(global.SpeechSynthesisUtterance).toHaveBeenCalledWith('Hello');
    const utterance = (global.SpeechSynthesisUtterance as jest.Mock).mock.results[0].value;
    expect(utterance.lang).toBe('en-US');
  });
});
