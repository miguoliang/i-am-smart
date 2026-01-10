import type { Metadata } from "next";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{ url: string; alt?: string; width?: number; height?: number }>;
    type?: "website" | "article" | "profile";
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
  };
  twitter?: {
    card?: "summary" | "summary_large_image" | "app" | "player";
    title?: string;
    description?: string;
    images?: string[];
  };
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export function generateMetadata(pageMetadata: PageMetadata): Metadata {
  const {
    title,
    description,
    keywords,
    openGraph,
    twitter,
    canonical,
    noindex,
    nofollow,
  } = pageMetadata;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://be-it-forever.com";
  const fullTitle = title.includes("Be It Forever") ? title : `${title} | Be It Forever`;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.join(", "),
    alternates: {
      canonical: canonical || siteUrl,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
      },
    },
    openGraph: {
      title: openGraph?.title || fullTitle,
      description: openGraph?.description || description,
      url: canonical || siteUrl,
      siteName: "Be It Forever",
      images: openGraph?.images || [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
      locale: "zh_CN",
      type: openGraph?.type || "website",
      publishedTime: openGraph?.publishedTime,
      modifiedTime: openGraph?.modifiedTime,
      authors: openGraph?.authors,
    },
    twitter: {
      card: twitter?.card || "summary_large_image",
      title: twitter?.title || fullTitle,
      description: twitter?.description || description,
      images: twitter?.images || [`${siteUrl}/og-image.png`],
    },
  };
}
