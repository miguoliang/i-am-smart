/**
 * Integration tests for POST /api/cards/[id]/review
 * Tests the route handler with mocked auth and CardService (full request → response flow).
 * @jest-environment node
 */
import { POST } from "./route";
import { requireAuth } from "@/lib/middleware/auth";
import { createCardService } from "@/lib/services/factory";
import { NextRequest } from "next/server";

jest.mock("@/lib/middleware/auth");
jest.mock("@/lib/services/factory");

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockCreateCardService = createCardService as jest.MockedFunction<
  typeof createCardService
>;

describe("POST /api/cards/[id]/review (integration)", () => {
  const mockUser = { id: "user-123", email: "test@example.com" };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      user: mockUser as never,
      supabase: {} as never,
    });
  });

  it("returns 200 and nextReview when review succeeds", async () => {
    const nextReview = "2025-02-02T00:00:00.000Z";
    const mockReviewCard = jest.fn().mockResolvedValue({
      success: true,
      nextReview,
    });
    mockCreateCardService.mockResolvedValue({
      reviewCard: mockReviewCard,
    } as never);

    const req = new NextRequest("http://localhost/api/cards/1/review", {
      method: "POST",
      body: JSON.stringify({ quality: 5, timezoneOffset: -480 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
    expect(body.data.success).toBe(true);
    expect(body.data.nextReview).toBe(nextReview);
    expect(mockReviewCard).toHaveBeenCalledWith(
      "user-123",
      1,
      5,
      -480
    );
  });

  it("returns 401 when requireAuth throws ApiError.unauthorized", async () => {
    const { ApiError } = await import("@/lib/utils/apiErrorClasses");
    mockRequireAuth.mockRejectedValue(ApiError.unauthorized("Unauthorized"));

    const req = new NextRequest("http://localhost/api/cards/1/review", {
      method: "POST",
      body: JSON.stringify({ quality: 5 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBeDefined();
    expect(mockCreateCardService).not.toHaveBeenCalled();
  });

  it("returns 400 when quality is out of range", async () => {
    const req = new NextRequest("http://localhost/api/cards/1/review", {
      method: "POST",
      body: JSON.stringify({ quality: 10 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(mockCreateCardService).not.toHaveBeenCalled();
  });

  it("returns 400 when card id is not a number", async () => {
    const mockReviewCard = jest.fn();
    mockCreateCardService.mockResolvedValue({
      reviewCard: mockReviewCard,
    } as never);

    const req = new NextRequest("http://localhost/api/cards/abc/review", {
      method: "POST",
      body: JSON.stringify({ quality: 5 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req, {
      params: Promise.resolve({ id: "abc" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(mockReviewCard).not.toHaveBeenCalled();
  });
});
