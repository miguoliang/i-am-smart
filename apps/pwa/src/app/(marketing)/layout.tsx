import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from "@/lib/seo/structured-data";
import { StructuredData } from "@/components/seo/StructuredData";
import { MarketingFooter } from "./components/MarketingFooter";
import { Navigation } from "./components/Navigation";

// Default metadata for marketing layout
// Individual pages should override with their own metadata
export const metadata: Metadata = generateSEOMetadata({
  title: "聪明的背单词工具",
  description:
    "基于间隔重复算法的英语学习应用，支持PWA和微信小程序。科学复习，多端同步，支持微信支付和支付宝。",
  keywords: [
    "英语学习",
    "间隔重复",
    "SM-2算法",
    "记忆卡片",
    "语言学习",
    "背单词",
    "学习应用",
    "PWA",
  ],
  openGraph: {
    type: "website",
  },
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationData = generateOrganizationStructuredData();
  const websiteData = generateWebsiteStructuredData();

  return (
    <>
      <StructuredData data={organizationData} />
      <StructuredData data={websiteData} />
      <Navigation />
      {children}
      <MarketingFooter />
    </>
  );
}
