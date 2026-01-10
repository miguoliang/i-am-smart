import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://be-it-forever.com";
  
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/operator/",
          "/learn/",
          "/stats/",
          "/feedback/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
