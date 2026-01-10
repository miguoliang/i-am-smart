import type { WithContext, Organization, WebSite, Article, BreadcrumbList, SearchAction } from "schema-dts";

export interface StructuredDataConfig {
  type: "organization" | "website" | "article" | "breadcrumb";
  data: Record<string, unknown>;
}

interface SearchActionWithQueryInput extends SearchAction {
  "query-input"?: string;
}

export function generateOrganizationStructuredData(): WithContext<Organization> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://be-it-forever.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Be It Forever",
    alternateName: "背它一辈子",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "一个基于间隔重复的英语学习应用，帮助您终身掌握知识",
    sameAs: [
      // Add social media links here
    ],
  };
}

export function generateWebsiteStructuredData(): WithContext<WebSite> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://be-it-forever.com";
  
  const searchAction: SearchActionWithQueryInput = {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  };
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Be It Forever",
    alternateName: "背它一辈子",
    url: siteUrl,
    description: "一个基于间隔重复的英语学习应用，帮助您终身掌握知识",
    potentialAction: searchAction as SearchAction,
  };
}

export function generateArticleStructuredData(
  title: string,
  description: string,
  publishedTime: string,
  modifiedTime?: string,
  image?: string,
  author?: string
): WithContext<Article> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://be-it-forever.com";
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: image ? [image] : [`${siteUrl}/og-image.png`],
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: author
      ? {
          "@type": "Person",
          name: author,
        }
      : {
          "@type": "Organization",
          name: "Be It Forever",
        },
    publisher: {
      "@type": "Organization",
      name: "Be It Forever",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
  };
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
