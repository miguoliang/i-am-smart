/**
 * Integration tests for the learn flow: load due cards → display card → reveal answer → rate.
 * Tests the full flow with mocked API client (avoids loading next/server in jsdom).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import Learn from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn(() => null) }),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/utils/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock("@/lib/utils/apiError", () => ({
  parseApiErrorResponse: async (_res: Response, defaultMessage: string) => defaultMessage,
}));

jest.mock("@/hooks/useProfile", () => ({
  useProfile: () => ({
    profiles: [{ id: "profile-1", account_id: "user-1", name: "我", is_default: true }],
    activeProfile: { id: "profile-1", account_id: "user-1", name: "我", is_default: true },
    setActiveProfileId: jest.fn(),
    isLoading: false,
    refetch: jest.fn(),
  }),
  ProfileProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/app/(marketing)/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" }, loading: false, isAuthenticated: true }),
}));

const mockCard = {
  id: 1,
  knowledge_code: "k1",
  knowledge: {
    code: "k1",
    name: "Hello",
    description: "A greeting",
    metadata: {},
  },
  next_review_date: "2025-02-01",
  ease_factor: 2.5,
  repetitions: 0,
  interval_days: 0,
};

const mockFetchDueCards = jest.fn().mockResolvedValue({
  reviewedCount: 0,
  cards: [mockCard],
});
const mockReviewCard = jest.fn().mockResolvedValue(undefined);

jest.mock("@/lib/api/cards", () => ({
  fetchDueCards: (...args: unknown[]) => mockFetchDueCards(...args),
  reviewCard: (...args: unknown[]) => mockReviewCard(...args),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("Learn flow (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchDueCards.mockResolvedValue({ reviewedCount: 0, cards: [mockCard] });
    mockReviewCard.mockResolvedValue(undefined);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      (window.speechSynthesis as { cancel: () => void; speak: (u: unknown) => void }).cancel = jest.fn();
      (window.speechSynthesis as { cancel: () => void; speak: (u: unknown) => void }).speak = jest.fn();
    }
  });

  it("loads due cards and displays first card", async () => {
    render(
      <TestWrapper>
        <Learn />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFetchDueCards).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    // Answer should not be visible until revealed
    expect(screen.queryByText(/A greeting/)).not.toBeInTheDocument();
  });

  it("reveals answer and shows rating buttons", async () => {
    render(
      <TestWrapper>
        <Learn />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    const revealButton = screen.getByRole("button", {
      name: /显示答案/,
    });
    await userEvent.click(revealButton);

    await waitFor(() => {
      const perfectButton = screen.getByRole("button", { name: /会了/ });
      expect(perfectButton).toBeInTheDocument();
    });
  });

  it("calls review API when user rates a card", async () => {
    render(
      <TestWrapper>
        <Learn />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    const revealButton = screen.getByRole("button", {
      name: /显示答案/,
    });
    await userEvent.click(revealButton);

    const perfectButton = await screen.findByRole("button", { name: /会了/ });

    // React 19 may throw AggregateError from concurrent state updates during review
    try {
      await userEvent.click(perfectButton);
    } catch {
      // Ignore AggregateError from act() — the review still fires
    }

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith(1, 4, "profile-1");
    });
  });
});
