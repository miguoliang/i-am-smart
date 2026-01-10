import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";
import { generateArticleStructuredData } from "@/lib/seo/structured-data";
import { MDXContent } from "../../components/MDXContent";
import { getContentBySlug } from "@/lib/content/loader";
import { StructuredData } from "@/components/seo/StructuredData";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Cache the post data to avoid duplicate fetching
const getCachedPost = cache(async (slug: string) => {
  return await getContentBySlug("blog", slug);
});

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPost(slug);

  if (!post) {
    return {};
  }

  return generateSEOMetadata({
    title: post.title,
    description: post.description,
    keywords: post.tags,
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author] : undefined,
      images: post.image ? [{ url: post.image }] : undefined,
    },
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getCachedPost(slug);

  if (!post) {
    notFound();
  }

  const articleData = generateArticleStructuredData(
    post.title,
    post.description,
    post.publishedAt,
    post.updatedAt,
    post.image,
    post.author
  );

  return (
    <>
      <StructuredData data={articleData} />
      <article className="min-h-screen">
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                {post.readingTime && (
                  <span>{post.readingTime} 分钟阅读</span>
                )}
                {post.author && <span>作者: {post.author}</span>}
              </div>
            </header>
            <MDXContent source={post.content} />
          </div>
        </section>
      </article>
    </>
  );
}
