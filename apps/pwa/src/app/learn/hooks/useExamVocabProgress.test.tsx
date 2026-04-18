/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExamVocabProgress } from './useExamVocabProgress';

jest.mock('@/lib/api/examVocabProgress', () => ({
  fetchExamVocabProgress: jest.fn(),
}));

import { fetchExamVocabProgress } from '@/lib/api/examVocabProgress';

function wrapper(client: QueryClient) {
  return function W({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useExamVocabProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch when profileId missing', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderHook(() => useExamVocabProgress(undefined), {
      wrapper: wrapper(client),
    });
    expect(fetchExamVocabProgress).not.toHaveBeenCalled();
  });

  it('fetches when profileId set', async () => {
    const data = [{ examId: 'e1', name: 'E', total: 10, brushed: 2 }];
    (fetchExamVocabProgress as jest.Mock).mockResolvedValue(data);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useExamVocabProgress('prof-1'), {
      wrapper: wrapper(client),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchExamVocabProgress).toHaveBeenCalledWith('prof-1');
    expect(result.current.data).toEqual(data);
  });
});
