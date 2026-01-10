"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./Navigation";

// Routes that should NOT show the main navigation
// (they have their own navigation systems)
const NO_NAV_ROUTES = ["/operator"];

export function ConditionalNavigation() {
  const pathname = usePathname();

  // Don't show navigation on operator pages (they have their own nav)
  if (pathname && NO_NAV_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  // Show navigation on all other pages
  return <Navigation />;
}
