import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSEOMetadata({
  title: "关于我们",
  description: "了解Be It Forever的使命和愿景，我们致力于帮助用户通过科学的方法终身掌握知识。",
  keywords: ["关于", "使命", "愿景", "团队"],
});

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
            关于 Be It Forever
          </h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <h2 className="text-3xl font-semibold mt-12 mb-4 text-gray-900 dark:text-white">
              我们的使命
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              我们相信，通过科学的学习方法和先进的技术，每个人都可以更高效地学习和记忆知识。
              我们的使命是提供一个易于使用、功能强大的学习工具，帮助用户建立长期记忆。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
