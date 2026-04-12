/**
 * Integration tests for the learn flow: load due cards → display card → reveal answer → rate.
 * Tests the full flow with mocked API client (avoids loading next/server in jsdom).
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import Learn from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/learn",
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
    exampleSentence: "",
    imageName: null,
    pos: "",
    level: "",
    selfExaminePrompt: "",
    theme: "",
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
      expect(
        within(screen.getByTestId("word-card")).getByText("Hello")
      ).toBeInTheDocument();
    });

    // Answer should not be visible until revealed
    expect(screen.queryByText(/A greeting/)).not.toBeInTheDocument();
  });

  it("chooses 会了, shows answer and 下一个", async () => {
    render(
      <TestWrapper>
        <Learn />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        within(screen.getByTestId("word-card")).getByText("Hello")
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /会了/ }));

    await waitFor(() => {
      expect(
        within(screen.getByTestId("word-card")).getByText(/A greeting/)
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /记错了/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /下一个/ })).toBeInTheDocument();
  });

  it("calls review API when user rates a card", async () => {
    render(
      <TestWrapper>
        <Learn />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        within(screen.getByTestId("word-card")).getByText("Hello")
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /会了/ }));

    const nextButton = await screen.findByRole("button", { name: /下一个/ });

    try {
      await userEvent.click(nextButton);
    } catch {
      // Ignore AggregateError from act() — the review still fires
    }

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith(1, 4, "profile-1");
    });
  });

  it("calls review API with quality 1 when 记错了 after 会了", async () => {
    render(
      <TestWrapper>
        <Learn />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        within(screen.getByTestId("word-card")).getByText("Hello")
      ).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /会了/ }));

    const misrememberButton = await screen.findByRole("button", { name: /记错了/ });

    try {
      await userEvent.click(misrememberButton);
    } catch {
      // Ignore AggregateError from act() — the review still fires
    }

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith(1, 1, "profile-1");
    });
  });
});
