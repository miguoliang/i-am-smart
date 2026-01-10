import type { Metadata } from "next";
import Link from "next/link";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = generateSEOMetadata({
  title: "功能特性",
  description: "了解Be It Forever的所有功能特性，包括间隔重复算法、文本转语音、可视化统计等。",
  keywords: ["功能", "特性", "间隔重复", "SM-2", "文本转语音", "统计"],
});

interface FeatureDetail {
  title: string;
  description: string;
  features?: string[];
}

interface CoreFeature {
  icon: string;
  title: string;
  description: string;
  features: string[];
  demoPlaceholder?: string;
}

export default function FeaturesPage() {
  const coreFeatures: CoreFeature[] = [
    {
      icon: "🧠",
      title: "智能复习",
      description: "让系统自动安排复习计划，您只需专注于学习。",
      features: [
        "SM-2 算法：基于科学验证的间隔重复算法，根据记忆表现自动调整复习间隔",
        "自适应学习：根据您的评分（0-5分）动态调整难度和复习频率",
        "记忆曲线优化：在最佳遗忘点进行复习，最大化记忆效率",
        "学习状态跟踪：新卡片 → 学习中 → 已掌握，清晰的学习路径",
      ],
      demoPlaceholder: "展示卡片复习流程、复习间隔调整和学习状态转换",
    },
    {
      icon: "🗣️",
      title: "文本转语音",
      description: "正确掌握每个单词的发音，提升口语能力。",
      features: [
        "多口音支持：美式英语和英式英语发音",
        "即时播放：点击即可听到标准发音",
        "沉浸式学习：通过听觉强化记忆",
        "发音练习：帮助纠正发音，提升口语水平",
      ],
      demoPlaceholder: "展示单词卡片上的播放按钮、不同口音切换和发音学习流程",
    },
    {
      icon: "📊",
      title: "可视化统计",
      description: "清晰了解您的学习进度和成果。",
      features: [
        "学习热力图：每日学习活动一目了然",
        "掌握程度图表：跟踪每个知识点的掌握情况",
        "连续学习记录：保持学习习惯，记录学习天数",
        "详细分析：复习次数、正确率、学习趋势等",
      ],
      demoPlaceholder: "展示热力图可视化、统计图表和数据分析、学习进度跟踪",
    },
    {
      icon: "⚡",
      title: "间隔重复算法",
      description: "科学优化您的学习节奏，提高记忆效率。",
      features: [
        "SM-2 算法：经过科学验证的 Anki SM-2 算法",
        "个性化调整：根据个人表现自动优化复习间隔",
        "记忆强度计算：基于 Ease Factor 和 Repetitions 计算最佳复习时间",
        "长期记忆：通过科学间隔实现终身记忆",
      ],
      demoPlaceholder: "解释算法工作原理、展示复习间隔计算、对比传统学习 vs 间隔重复的效果",
    },
  ];

  const otherFeatures: FeatureDetail[] = [
    {
      title: "响应式设计",
      description: "完美适配手机、平板和桌面设备",
    },
    {
      title: "进度跟踪",
      description: "详细记录每个知识点的学习历史",
    },
    {
      title: "多设备同步",
      description: "随时随地继续学习",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white">
            掌握知识的最佳方式
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            基于科学验证的间隔重复算法，让学习更高效、记忆更持久
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                开始学习
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                下载应用
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features - Detailed Blocks */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="space-y-24">
          {coreFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col ${
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } gap-12 items-center`}
            >
              {/* Content */}
              <div className="flex-1">
                <div className="text-5xl mb-6">{feature.icon}</div>
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                  {feature.title}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                  {feature.description}
                </p>
                <ul className="space-y-4">
                  {feature.features.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                    >
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Demo Placeholder */}
              <div className="flex-1 w-full">
                <div className="aspect-video bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <p className="text-gray-600 dark:text-gray-400 text-center px-8">
                    {feature.demoPlaceholder}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Other Features Overview */}
      <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            强大而灵活
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {otherFeatures.map((feature, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Changelog Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            更新日志
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            展示最新版本的功能更新和改进
          </p>
          <Link href="/changelog">
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              查看更新日志 →
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
            立即开始学习
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            下载应用或在线开始
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                在线开始
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                下载应用
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
