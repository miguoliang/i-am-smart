/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";
import { proxy } from "./proxy";

// Track the middleware response so tests can simulate token refresh cookies
let latestMiddlewareRes: NextResponse;

// Mock the Supabase middleware client
const mockGetUser = jest.fn();

jest.mock("@/lib/supabaseServer", () => ({
  createMiddlewareClient: jest.fn((req: NextRequest) => {
    // Use the actual NextResponse to build a response that carries updated cookies
    const { NextResponse } = jest.requireActual("next/server") as typeof import("next/server");
    const res = NextResponse.next({ request: req });
    latestMiddlewareRes = res;
    return {
      supabase: {
        auth: {
          getUser: mockGetUser,
        },
      },
      res,
    };
  }),
}));

function buildRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, "http://localhost:3000"));
}

describe("proxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("session refresh", () => {
    it("should call getUser to refresh the session", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

      await proxy(buildRequest("/"));

      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("unauthenticated users", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it("should redirect from /learn to /signin", async () => {
      const res = await proxy(buildRequest("/learn"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/learn");
    });

    it("should redirect from /stats to /signin", async () => {
      const res = await proxy(buildRequest("/stats"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/stats");
    });

    it("should redirect from /feedback to /signin", async () => {
      const res = await proxy(buildRequest("/feedback"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/feedback");
    });

    it("should redirect from /operator to /signin", async () => {
      const res = await proxy(buildRequest("/operator"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/operator");
    });

    it("should redirect from nested protected routes to /signin", async () => {
      const res = await proxy(buildRequest("/operator/accounts"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/operator/accounts");
    });

    it("should allow access to /signin", async () => {
      const res = await proxy(buildRequest("/signin"));

      expect(res.status).toBe(200);
    });

    it("should allow access to / (home page)", async () => {
      const res = await proxy(buildRequest("/"));

      expect(res.status).toBe(200);
    });


    it("should allow access to /terms", async () => {
      const res = await proxy(buildRequest("/terms"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /privacy", async () => {
      const res = await proxy(buildRequest("/privacy"));

      expect(res.status).toBe(200);
    });
  });

  describe("authenticated users", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    });

    it("should redirect from /signin to /learn", async () => {
      const res = await proxy(buildRequest("/signin"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/learn");
    });

    it("should allow access to /learn", async () => {
      const res = await proxy(buildRequest("/learn"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /stats", async () => {
      const res = await proxy(buildRequest("/stats"));

      expect(res.status).toBe(200);
    });

    it("should redirect from / to /learn", async () => {
      const res = await proxy(buildRequest("/"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/learn");
    });

    it("should allow access to /operator", async () => {
      const res = await proxy(buildRequest("/operator"));

      expect(res.status).toBe(200);
    });
  });

  describe("cookie forwarding on redirects", () => {
    it("should forward refreshed session cookies when redirecting authenticated user from /signin", async () => {
      // Simulate getUser() triggering a token refresh that sets cookies
      mockGetUser.mockImplementation(async () => {
        // Simulate Supabase writing refreshed cookies to the middleware response
        latestMiddlewareRes.cookies.set("sb-access-token", "refreshed-token-value");
        latestMiddlewareRes.cookies.set("sb-refresh-token", "new-refresh-token");
        return { data: { user: { id: "user-1" } } };
      });

      const res = await proxy(buildRequest("/signin"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/learn");

      // Verify refreshed cookies are forwarded to the redirect response
      const cookies = res.cookies.getAll();
      const accessToken = cookies.find((c) => c.name === "sb-access-token");
      const refreshToken = cookies.find((c) => c.name === "sb-refresh-token");
      expect(accessToken?.value).toBe("refreshed-token-value");
      expect(refreshToken?.value).toBe("new-refresh-token");
    });

    it("should forward cookies when redirecting unauthenticated user from protected route", async () => {
      mockGetUser.mockImplementation(async () => {
        // Even for unauthenticated users, Supabase may clear stale cookies
        latestMiddlewareRes.cookies.set("sb-access-token", "");
        return { data: { user: null } };
      });

      const res = await proxy(buildRequest("/learn"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");

      // Verify cookies from middleware response are forwarded
      const cookies = res.cookies.getAll();
      const accessToken = cookies.find((c) => c.name === "sb-access-token");
      expect(accessToken).toBeDefined();
    });
  });
});
