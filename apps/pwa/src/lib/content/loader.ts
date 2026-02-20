import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ContentPage } from "./types";

const contentDirectory = path.join(process.cwd(), "content");

export async function getContentBySlug(
  directory: string,
  slug: string
): Promise<ContentPage | null> {
  const fullPath = path.join(contentDirectory, directory, `${slug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    ...(data as Omit<ContentPage, "content">),
    content,
    slug,
  };
}

export async function getAllContent(directory: string): Promise<ContentPage[]> {
  const fullPath = path.join(contentDirectory, directory);
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }

  const files = fs.readdirSync(fullPath);
  const allContent = files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const fileContents = fs.readFileSync(
        path.join(fullPath, file),
        "utf8"
      );
      const { data, content } = matter(fileContents);

      return {
        ...(data as Omit<ContentPage, "content" | "slug">),
        content,
        slug,
      };
    })
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA; // Sort by newest first
    });

  return allContent;
}
