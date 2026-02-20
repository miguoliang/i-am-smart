export interface ContentFrontMatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  category?: string;
  featured?: boolean;
  image?: string;
  slug?: string;
}

export interface ContentPage extends ContentFrontMatter {
  content: string;
  readingTime?: number;
}
