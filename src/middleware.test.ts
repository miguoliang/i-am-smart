/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

// Mock the Supabase middleware client
const mockGetUser = jest.fn();

jest.mock("@/lib/supabaseServer", () => ({
  createMiddlewareClient: jest.fn((req: NextRequest) => {
    // Use the actual NextResponse to build a response that carries updated cookies
    const { NextResponse } = jest.requireActual("next/server") as typeof import("next/server");
    const res = NextResponse.next({ request: req });
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

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("session refresh", () => {
    it("should call getUser to refresh the session", async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });

      await middleware(buildRequest("/"));

      expect(mockGetUser).toHaveBeenCalledTimes(1);
    });
  });

  describe("unauthenticated users", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
    });

    it("should redirect from /learn to /signin", async () => {
      const res = await middleware(buildRequest("/learn"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/learn");
    });

    it("should redirect from /stats to /signin", async () => {
      const res = await middleware(buildRequest("/stats"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/stats");
    });

    it("should redirect from /feedback to /signin", async () => {
      const res = await middleware(buildRequest("/feedback"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/feedback");
    });

    it("should redirect from /operator to /signin", async () => {
      const res = await middleware(buildRequest("/operator"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/operator");
    });

    it("should redirect from nested protected routes to /signin", async () => {
      const res = await middleware(buildRequest("/operator/accounts"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/signin");
      expect(location.searchParams.get("next")).toBe("/operator/accounts");
    });

    it("should allow access to /signin", async () => {
      const res = await middleware(buildRequest("/signin"));

      expect(res.status).toBe(200);
    });

    it("should allow access to / (home page)", async () => {
      const res = await middleware(buildRequest("/"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /about", async () => {
      const res = await middleware(buildRequest("/about"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /terms", async () => {
      const res = await middleware(buildRequest("/terms"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /privacy", async () => {
      const res = await middleware(buildRequest("/privacy"));

      expect(res.status).toBe(200);
    });
  });

  describe("authenticated users", () => {
    beforeEach(() => {
      mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    });

    it("should redirect from /signin to /learn", async () => {
      const res = await middleware(buildRequest("/signin"));

      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/learn");
    });

    it("should allow access to /learn", async () => {
      const res = await middleware(buildRequest("/learn"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /stats", async () => {
      const res = await middleware(buildRequest("/stats"));

      expect(res.status).toBe(200);
    });

    it("should allow access to / (home page)", async () => {
      const res = await middleware(buildRequest("/"));

      expect(res.status).toBe(200);
    });

    it("should allow access to /operator", async () => {
      const res = await middleware(buildRequest("/operator"));

      expect(res.status).toBe(200);
    });
  });
});
