/**
 * Preview vs production is chosen at request time from the Host header so one
 * build can serve both preview.iamsmart.top and www.iamsmart.top.
 */

export type DeploymentSurface = "preview" | "production" | "other";

const PREVIEW_HOST = "preview.iamsmart.top";
const PRODUCTION_HOST = "www.iamsmart.top";

export function parseForwardedHost(
  xForwardedHost: string | null | undefined,
  host: string | null | undefined
): string {
  const raw = (xForwardedHost ?? host ?? "").trim();
  if (!raw) return "";
  const first = raw.split(",")[0].trim();
  return first.split(":")[0].toLowerCase();
}

export function getDeploymentSurfaceFromHostname(hostname: string): DeploymentSurface {
  if (hostname === PREVIEW_HOST) return "preview";
  if (hostname === PRODUCTION_HOST) return "production";
  return "other";
}

export function getDeploymentSurfaceFromHeaders(
  getHeader: (name: string) => string | null
): DeploymentSurface {
  const hostname = parseForwardedHost(
    getHeader("x-forwarded-host"),
    getHeader("host")
  );
  return getDeploymentSurfaceFromHostname(hostname);
}

export function isProductionSurface(surface: DeploymentSurface): boolean {
  return surface === "production";
}
