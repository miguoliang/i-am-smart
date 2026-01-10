import type { Metadata } from "next";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAllContent } from "@/lib/content/loader";

export const metadata: Metadata = generateSEOMetadata({
  title: "博客",
  description: "阅读Be It Forever的最新文章、学习技巧和产品更新。",
  keywords: ["博客", "文章", "学习技巧", "更新"],
});

async function getBlogPosts() {
  return await getAllContent("blog");
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts();

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-8 text-gray-900 dark:text-white">
            博客
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
            阅读最新文章，了解学习技巧和产品更新。
          </p>

          {blogPosts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">暂无文章。</p>
          ) : (
            <div className="space-y-6">
              {blogPosts.map((post) => (
                <Card key={post.slug} className="p-6">
                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                      {post.title}
                    </h2>
                  </Link>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{post.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <time dateTime={post.publishedAt}>
                      {new Date(post.publishedAt).toLocaleDateString("zh-CN")}
                    </time>
                    {post.readingTime && <span>{post.readingTime} 分钟阅读</span>}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
