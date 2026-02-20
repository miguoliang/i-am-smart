/**
 * Integration tests for GET /api/cards/due
 * Tests the route handler with mocked auth and CardService (full request → response flow).
 * @jest-environment node
 */
import { GET } from "./route";
import { requireAuth } from "@/lib/middleware/auth";
import { createCardService } from "@/lib/services/factory";
import { NextRequest } from "next/server";

jest.mock("@/lib/middleware/auth");
jest.mock("@/lib/services/factory");

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockCreateCardService = createCardService as jest.MockedFunction<
  typeof createCardService
>;

describe("GET /api/cards/due (integration)", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { daily_due_limit: 10 }, error: null }),
        })),
      })),
    })),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      user: mockUser as never,
      supabase: mockSupabase as never,
    });
  });

  it("returns 200 and due cards when auth and service succeed", async () => {
    const mockCards = [
      {
        id: 1,
        knowledge_code: "k1",
        knowledge: {
          code: "k1",
          name: "Test",
          description: "Desc",
          metadata: {},
        },
        next_review_date: "2025-02-01",
      },
    ];
    const mockGetDueCards = jest.fn().mockResolvedValue({
      reviewedCount: 0,
      cards: mockCards,
    });
    mockCreateCardService.mockResolvedValue({
      getDueCards: mockGetDueCards,
    } as never);

    const url = "http://localhost/api/cards/due?level=A1&timezoneOffset=-480";
    const req = new NextRequest(url);

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.reviewedCount).toBe(0);
    expect(body.data.cards).toHaveLength(1);
    expect(body.data.cards[0].id).toBe(1);
    expect(body.data.cards[0].knowledge_code).toBe("k1");
    expect(mockRequireAuth).toHaveBeenCalledTimes(1);
    expect(mockGetDueCards).toHaveBeenCalledWith(
      "user-123",
      "A1",
      -480,
      10
    );
  });

  it("returns 200 and empty cards when daily limit reached", async () => {
    const mockGetDueCards = jest.fn().mockResolvedValue({
      reviewedCount: 10,
      cards: [],
    });
    mockCreateCardService.mockResolvedValue({
      getDueCards: mockGetDueCards,
    } as never);

    const url = "http://localhost/api/cards/due";
    const req = new NextRequest(url);

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.reviewedCount).toBe(10);
    expect(body.data.cards).toEqual([]);
    expect(mockGetDueCards).toHaveBeenCalledWith(
      "user-123",
      undefined,
      undefined,
      10
    );
  });

  it("returns 401 when requireAuth throws ApiError.unauthorized", async () => {
    const { ApiError } = await import("@/lib/utils/apiErrorClasses");
    mockRequireAuth.mockRejectedValue(ApiError.unauthorized("Unauthorized"));

    const req = new NextRequest("http://localhost/api/cards/due");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBeDefined();
    expect(body.error.message).toBeDefined();
    expect(mockCreateCardService).not.toHaveBeenCalled();
  });

  it("returns 400 when level is invalid", async () => {
    const url = "http://localhost/api/cards/due?level=INVALID";
    const req = new NextRequest(url);

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(mockCreateCardService).not.toHaveBeenCalled();
  });
});
