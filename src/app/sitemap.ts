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
      url: "/docs",
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "/blog",
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  return generateSitemap(entries);
}
