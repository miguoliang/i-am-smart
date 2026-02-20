import type { MetadataRoute } from "next";

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

export function generateSitemap(entries: SitemapEntry[]): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iamsmart.top";
  
  return entries.map((entry) => ({
    url: entry.url.startsWith("http") ? entry.url : `${siteUrl}${entry.url}`,
    lastModified: entry.lastModified || new Date(),
    changeFrequency: entry.changeFrequency || "weekly",
    priority: entry.priority || 0.5,
  }));
}
