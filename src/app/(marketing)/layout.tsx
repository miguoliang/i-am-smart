import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import {
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
} from "@/lib/seo/structured-data";
import { StructuredData } from "@/components/seo/StructuredData";
import { MarketingFooter } from "./components/MarketingFooter";
import { Navigation } from "./components/Navigation";

export const metadata: Metadata = generateSEOMetadata({
  title: "Be It Forever - 背它一辈子",
  description:
    "一个基于间隔重复的英语学习应用，帮助您终身掌握知识。使用SM-2算法优化学习，支持文本转语音，提供可视化统计和进度跟踪。",
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
