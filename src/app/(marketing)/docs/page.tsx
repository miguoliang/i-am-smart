import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata: Metadata = generateSEOMetadata({
  title: "文档",
  description: "Be It Forever的使用文档和API参考，帮助您快速上手和深入了解应用功能。",
  keywords: ["文档", "使用指南", "API", "教程"],
});

export default function DocsPage() {
  const docSections = [
    {
      title: "快速开始",
      description: "了解如何快速开始使用Be It Forever",
      href: "/docs/getting-started",
    },
    {
      title: "用户指南",
      description: "学习如何使用各种功能，包括创建卡片、复习、查看统计等",
      href: "/docs/user-guide",
    },
    {
      title: "管理员指南",
      description: "了解如何管理内容、用户和系统设置",
      href: "/docs/admin-guide",
    },
    {
      title: "API参考",
      description: "查看API文档，了解如何集成和使用API",
      href: "/docs/api",
    },
    {
      title: "常见问题",
      description: "查看常见问题的解答",
      href: "/docs/faq",
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
            文档
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            查找您需要的文档和指南，快速上手Be It Forever。
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {docSections.map((section, index) => (
              <Link
                key={index}
                href={section.href}
                className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {section.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{section.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
