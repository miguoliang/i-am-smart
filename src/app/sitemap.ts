import type { MetadataRoute } from "next";
import { generateSitemap, type SitemapEntry } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: SitemapEntry[] = [
    {
      url: "/",
      changeFrequency: "daily",
      priority: 1.0,
    },
    // Note: /features and /pricing redirect to homepage anchors (#features, #pricing)
    // They are excluded from sitemap to avoid SEO issues with redirect-only pages
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
