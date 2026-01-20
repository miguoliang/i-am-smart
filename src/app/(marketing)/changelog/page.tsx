import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { CollapsibleSection } from "./components/CollapsibleSection";

export const metadata: Metadata = generateSEOMetadata({
  title: "更新日志",
  description: "Be It Forever的版本更新日志，了解最新功能和改进。",
  keywords: ["更新日志", "版本", "更新", "新功能"],
});

// 注意：在生产环境中，应该从 CHANGELOG.md 解析数据
// 这里为了演示，直接使用数据结构
const changelogData = [
  {
    date: "2025-01-16",
    category: "体验",
    title: "主页样式优化",
    description: "优化了主页的视觉样式和深色模式配色，提升用户体验。",
    features: [
      {
        title: "主页样式优化",
        description: "优化了主页的视觉样式和深色模式配色，提升用户体验。",
        items: [
          "移除了 `bg-linear-to-b` 和 `bg-linear-to-br` 渐变类",
          "统一了 CTA 部分的深色模式配色，使其与页面背景保持一致",
          "改进了文本颜色对比度，提升可读性",
        ],
      },
    ],
    improvements: [
      "统一了深色模式下的背景配色方案",
      "优化了 CTA 部分的文本颜色对比度",
    ],
    changes: ["移除了主容器和 CTA 部分的线性渐变背景类"],
    bugFixes: [],
  },
  {
    date: "2025-01-15",
    category: "体验",
    title: "主页视觉更新",
    description: "更新了主页的图片资源，使用本地图片替代占位符。",
    features: [
      {
        title: "主页视觉更新",
        description: "更新了主页的图片资源，使用本地图片替代占位符。",
        items: [
          "替换了 Section 1 和 Section 2 的占位图片为本地 WebP 图片",
          "优化了 CTA 部分的宽度，使其完全填充容器",
          "更新了图片的 alt 文本，提升可访问性",
        ],
      },
    ],
    improvements: [
      "使用优化的 WebP 格式图片，提升加载性能",
      "改进了图片的语义化描述",
    ],
    changes: ["CTA 部分改为全宽布局"],
    bugFixes: [],
  },
  {
    date: "2025-01-14",
    category: "功能",
    title: "主页重新设计",
    description: "重新设计了主页，采用情感化叙事和视觉化展示。",
    features: [
      {
        title: "主页重新设计",
        description: "重新设计了主页，采用情感化叙事和视觉化展示。",
        items: [
          "实现了情感化的三段式叙事结构（戳痛区、向往区、行动区）",
          "添加了图片占位符，为后续内容做准备",
          "优化了响应式布局和移动端体验",
        ],
      },
    ],
    improvements: [
      "改进了主页的内容结构和视觉层次",
      "优化了移动端的显示效果",
    ],
    changes: [],
    bugFixes: [],
  },
  {
    date: "2025-01-13",
    category: "功能",
    title: "代码质量改进",
    description: "修复了代码审查中发现的问题和代码规范问题。",
    features: [],
    improvements: [],
    changes: [],
    bugFixes: [
      "修复了代码审查中发现的问题",
      "解决了 linting 警告",
    ],
  },
  {
    date: "2025-01-12",
    category: "体验",
    title: "学习界面优化",
    description: "优化了学习界面的显示效果和用户体验。",
    features: [
      {
        title: "学习界面优化",
        description: "优化了学习界面的显示效果和用户体验。",
        items: [
          "在主页的 iPad 和 iPhone 框架中添加了 MockLearnScreen",
          "居中对齐了进度指示器",
          "改进了学习界面的视觉呈现",
        ],
      },
    ],
    improvements: [
      "优化了学习界面的布局和视觉呈现",
      "改进了进度指示器的对齐方式",
    ],
    changes: [],
    bugFixes: [],
  },
];

export default function ChangelogPage() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        {/* 16-column grid system with horizontal gap, no vertical gap */}
        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-x-4">
          {/* First row: h1 title, aligned with content area (starts at column 5, spans 12 columns) */}
          <h1 className="col-start-5 col-span-12 text-lg font-normal text-gray-600 dark:text-gray-400">
            更新日志
          </h1>
        </div>

        {/* Second grid area with same settings */}
        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-x-4">
          {changelogData.map((entry, index) => (
            <div key={index} className="contents">
              {/* Left 4 columns: Date */}
              <div className="col-span-4 self-start sticky top-16 flex items-center gap-3">
                {/* Category pill */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                  {entry.category}
                </span>
                <time
                  dateTime={entry.date}
                  className="text-base tracking-wide text-gray-600 dark:text-gray-400"
                >
                  {formatDate(entry.date)}
                </time>
              </div>

              {/* Right 12 columns: Update content */}
              <div className="col-span-12 self-start">
                <h2 className="text-4xl font-light mb-2 text-gray-900 dark:text-white">
                  {entry.title}
                </h2>
                {entry.description && (
                  <p className="text-gray-600 dark:text-gray-400 my-6">
                    {entry.description}
                  </p>
                )}
                {/* Features, improvements, changes, bug fixes will go here */}
              </div>

              {/* Horizontal divider - only if not the last item */}
              {index < changelogData.length - 1 && (
                <div className="col-span-16 border-t border-gray-200 dark:border-gray-700 my-16" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
