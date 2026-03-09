/**
 * @jest-environment node
 */
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock supabaseServer
const mockSignInWithOtp = jest.fn();
jest.mock("@/lib/supabaseServer", () => ({
  createRouteHandlerClient: jest.fn(() =>
    Promise.resolve({
      auth: { signInWithOtp: mockSignInWithOtp },
    })
  ),
}));

// Mock next/headers (cookies)
jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: () => [],
      set: jest.fn(),
    })
  ),
}));

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/auth/send-phone-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/send-phone-otp", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns 200 on success", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    const res = await POST(makeRequest({ phone: "13800138000" }));
    expect(res.status).toBe(200);
  });

  it("returns 400 for missing phone", async () => {
    const res = await POST(makeRequest({}));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.message).toContain("手机号");
  });

  it("returns 400 for invalid phone format", async () => {
    const res = await POST(makeRequest({ phone: "123" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.message).toContain("格式");
  });

  it("returns 429 for rate limit errors", async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: {
        message:
          "For security purposes, you can only request this after 30 seconds",
      },
    });
    const res = await POST(makeRequest({ phone: "13800138000" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("returns 500 with friendly message for hook authorization error", async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: "Hook requires authorization token" },
    });
    const res = await POST(makeRequest({ phone: "13800138000" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).toBe("短信服务暂时不可用，请稍后重试");
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });

  it("returns 400 for other Supabase auth errors", async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: "Phone number is not valid" },
    });
    const res = await POST(makeRequest({ phone: "13800138000" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe("Phone number is not valid");
  });
});
