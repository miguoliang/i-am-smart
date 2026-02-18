import type { WithContext, Organization, WebSite, Article, BreadcrumbList, SearchAction } from "schema-dts";

export interface StructuredDataConfig {
  type: "organization" | "website" | "article" | "breadcrumb";
  data: Record<string, unknown>;
}

interface SearchActionWithQueryInput extends SearchAction {
  "query-input"?: string;
}

export function generateOrganizationStructuredData(): WithContext<Organization> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iamsmart.top";
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "聪明的背单词工具",
    alternateName: "背单词",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "一个基于间隔重复的英语学习应用，帮助您终身掌握知识",
    sameAs: [
      "https://github.com/miguoliang/be-it-forever",
      // Add other social media links when available
    ],
  };
}

export function generateWebsiteStructuredData(): WithContext<WebSite> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iamsmart.top";
  
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
    name: "聪明的背单词工具",
    alternateName: "背单词",
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://iamsmart.top";
  
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
          name: "聪明的背单词工具",
        },
    publisher: {
      "@type": "Organization",
      name: "聪明的背单词工具",
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
