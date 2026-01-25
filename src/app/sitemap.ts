import type { MetadataRoute } from "next";
import { generateSitemap, type SitemapEntry } from "@/lib/seo/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: SitemapEntry[] = [
    {
      url: "/",
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  return generateSitemap(entries);
}
