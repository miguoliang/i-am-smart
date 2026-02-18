import type { MetadataRoute } from "next";
import { generateSitemap, type SitemapEntry } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: SitemapEntry[] = [
    {
      url: "/",
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "/about",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "/features",
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "/pricing",
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: "/terms",
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "/privacy",
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return generateSitemap(entries);
}
