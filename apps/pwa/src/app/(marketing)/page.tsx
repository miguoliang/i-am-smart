import Link from "next/link";
import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/form/Button";
import { PricingSection } from "./components/PricingSection";

export const metadata: Metadata = generateSEOMetadata({
  title: "每天5分钟记住20个单词 - 聪明的背单词工具",
  description:
    "背了就忘？科学算法在你快忘的时候提醒复习。3000+词汇，覆盖KET·PET·四六级·雅思·托福，无需下载，多端同步。免费开始。",
  keywords: [
    "英语学习",
    "背单词",
    "间隔重复",
    "SM-2算法",
    "碎片时间学习",
    "多端同步",
    "PWA应用",
    "语言学习工具",
    "英语词汇",
    "记忆卡片",
    "学习应用",
    "在线学习",
  ],
  openGraph: {
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "每天5分钟记住20个单词 - 聪明的背单词工具",
      },
    ],
  },
  canonical: "/",
});

const features = [
  {
    emoji: "📱",
    title: "打开就用，不用下载",
    description: "浏览器直接用，不占手机内存",
  },
  {
    emoji: "🧠",
    title: "科学算法，不白背",
    description: "SM-2 间隔重复，在你快忘的时候提醒复习",
  },
  {
    emoji: "🔄",
    title: "多端同步，进度不丢",
    description: "手机、平板、电脑无缝切换",
  },
  {
    emoji: "🆓",
    title: "免费开始",
    description: "零成本体验，随时升级",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-16 md:pt-24 pb-8 md:pb-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900 dark:text-white">
            每天 5 分钟，记住 20 个英语单词
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400">
            背了就忘？科学算法在你快忘的时候提醒复习
          </p>
          <div className="pt-4">
            <Link href="/learn">
              <Button
                size="lg"
                className="text-lg md:text-xl px-12 py-6 bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-gray-900 dark:text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                免费试试 →
              </Button>
            </Link>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              打开就能学，注册解锁更多
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-sm text-gray-500 dark:text-gray-400">
          <span>3000+ 词汇</span>
          <span className="hidden sm:inline">·</span>
          <span>KET · PET · 四六级 · 雅思 · 托福</span>
          <span className="hidden sm:inline">·</span>
          <span>手机/平板/电脑多端同步</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="text-3xl mb-3">{feature.emoji}</div>
              <h3 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Second CTA */}
      <section className="py-12 md:py-16">
        <div className="text-center">
          <Link href="/learn">
            <Button
              size="lg"
              className="text-lg md:text-xl px-12 py-6 bg-amber-400 hover:bg-amber-500 dark:bg-amber-500 dark:hover:bg-amber-600 text-gray-900 dark:text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              免费试试 →
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection showTitle={true} id="pricing" titleTag="h2" />
    </div>
  );
}
