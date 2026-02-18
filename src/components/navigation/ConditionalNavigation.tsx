"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./Navigation";

// Routes that should NOT show navigation
// (they have their own navigation systems)
const NO_NAV_ROUTES = ["/operator"];

// Marketing routes - navigation is handled by MarketingLayout
const MARKETING_ROUTES = [
  "/",
  "/terms",
  "/privacy",
  "/pricing",
  "/features",
  "/pay",
];

// User routes - no top nav (they have bottom nav footer)
const USER_ROUTES = ["/learn", "/stats", "/feedback", "/signin"];

export function ConditionalNavigation() {
  const pathname = usePathname();

  if (!pathname) return null;

  // Don't show navigation on operator pages (they have their own nav)
  if (NO_NAV_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  // Marketing pages - navigation is in MarketingLayout, don't show here
  if (MARKETING_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  // User pages - no top nav (they have bottom nav footer)
  if (USER_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  // Default fallback - show navigation for other pages
  return <Navigation />;
}
