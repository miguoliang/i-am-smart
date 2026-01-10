import matter from "gray-matter";
import type { ContentFrontMatter, ContentPage } from "./types";

export function parseContent(content: string): ContentPage {
  const { data, content: body } = matter(content);
  
  return {
    ...(data as ContentFrontMatter),
    content: body,
    readingTime: calculateReadingTime(body),
  };
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function getAllContentSlugs(contentFiles: string[]): string[] {
  return contentFiles.map((file) => {
    const slug = file.replace(/\.mdx?$/, "");
    return slug;
  });
}
