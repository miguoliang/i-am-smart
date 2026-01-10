import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = generateSEOMetadata({
  title: "资源",
  description: "Be It Forever的学习资源，包括文档、教程、博客等。",
  keywords: ["资源", "文档", "教程", "学习指南"],
});

export default function ResourcesPage() {
  const resourceCategories = [
    {
      title: "文档",
      description: "完整的使用文档和API参考",
      items: [
        {
          title: "快速开始",
          description: "了解如何快速开始使用Be It Forever",
          href: "/docs/getting-started",
        },
        {
          title: "用户指南",
          description: "学习如何使用各种功能",
          href: "/docs/user-guide",
        },
        {
          title: "常见问题",
          description: "查看常见问题的解答",
          href: "/docs/faq",
        },
      ],
    },
    {
      title: "博客",
      description: "学习技巧、产品更新和最佳实践",
      items: [
        {
          title: "最新文章",
          description: "查看最新的博客文章",
          href: "/blog",
        },
        {
          title: "学习技巧",
          description: "提高学习效率的方法",
          href: "/blog",
        },
        {
          title: "产品更新",
          description: "了解最新功能和改进",
          href: "/blog",
        },
      ],
    },
    {
      title: "教程",
      description: "视频教程和示例",
      items: [
        {
          title: "入门教程",
          description: "从零开始学习使用Be It Forever",
          href: "/docs/getting-started",
        },
        {
          title: "高级技巧",
          description: "掌握高级功能和技巧",
          href: "/docs/user-guide",
        },
        {
          title: "最佳实践",
          description: "学习最佳实践和技巧",
          href: "/docs",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
              学习资源
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              查找您需要的文档、教程和指南，快速上手Be It Forever。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {resourceCategories.map((category) => (
              <div key={category.title}>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {category.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {category.description}
                </p>
                <div className="space-y-4">
                  {category.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Card className="p-4 hover:border-primary transition-colors">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.description}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
