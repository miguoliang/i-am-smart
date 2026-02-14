# Marketing Site Setup

This document describes the SEO-friendly, content-driven marketing site setup for Be It Forever.

## Overview

The marketing site is built using Next.js 16 App Router with:
- **MDX** for content-driven pages
- **Static Generation** for optimal SEO
- **Structured Data** (JSON-LD) for rich snippets
- **Automatic Sitemap** generation
- **Robots.txt** configuration

## Structure

```
src/app/
  (marketing)/          # Marketing site routes (doesn't affect URL)
    page.tsx            # Homepage (/)
    about/              # About page (/about)
    features/           # Features page (/features)
    docs/               # Documentation (/docs)
    blog/               # Blog listing (/blog)
    blog/[slug]/        # Blog posts (/blog/:slug)
    layout.tsx          # Marketing layout with SEO
    components/
      MDXComponents.tsx # Custom MDX components
      MDXContent.tsx    # MDX renderer

content/
  blog/                 # Blog posts in MDX format
    *.mdx

src/lib/
  seo/                  # SEO utilities
    metadata.ts         # Metadata generation
    structured-data.ts  # JSON-LD schemas
    sitemap.ts          # Sitemap utilities
  content/              # Content utilities
    types.ts            # TypeScript types
    utils.ts            # Content parsing
    loader.ts           # Content loading
```

## Route Conflict Resolution

**Important**: There's currently a route conflict between:
- `src/app/page.tsx` (sign-in page)
- `src/app/(marketing)/page.tsx` (marketing homepage)

### Option 1: Move Sign-in to `/sign-in` (Recommended)

Move the sign-in page to a dedicated route:

```bash
mkdir -p src/app/sign-in
mv src/app/page.tsx src/app/sign-in/page.tsx
```

Then update any redirects or links to point to `/sign-in`.

### Option 2: Use Middleware

Create middleware to route based on authentication state:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If authenticated, redirect to app
  // If not authenticated, show marketing site
  // Implementation depends on your auth setup
}
```

## Content Management

### Adding Blog Posts

1. Create a new `.mdx` file in `content/blog/`:

```mdx
---
title: Your Post Title
description: Post description for SEO
publishedAt: 2024-01-15
author: Author Name
tags: [tag1, tag2]
image: /path/to/image.png
---

# Your Content

Write your content in Markdown...
```

2. The post will automatically appear at `/blog/your-filename`

### Front Matter Fields

- `title` (required): Post title
- `description` (required): SEO description
- `publishedAt` (required): ISO date string
- `updatedAt` (optional): Last update date
- `author` (optional): Author name
- `tags` (optional): Array of tags
- `category` (optional): Category name
- `featured` (optional): Boolean for featured posts
- `image` (optional): Featured image URL
- `slug` (optional): Custom slug (defaults to filename)

## SEO Features

### Metadata

Each page uses the `generateMetadata` utility for consistent SEO:

```typescript
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSEOMetadata({
  title: "Page Title",
  description: "Page description",
  keywords: ["keyword1", "keyword2"],
  openGraph: {
    type: "article", // or "website"
    images: [{ url: "/og-image.png" }],
  },
});
```

### Structured Data

Structured data (JSON-LD) is automatically added for:
- Organization schema (in marketing layout)
- Website schema (in marketing layout)
- Article schema (in blog posts)
- Breadcrumb schema (can be added to pages)

### Sitemap

The sitemap is automatically generated at `/sitemap.xml`. Update `src/app/sitemap.ts` to add new routes.

### Robots.txt

Robots.txt is configured at `/robots.txt`. Update `src/app/robots.ts` to modify crawling rules.

## Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://iamsmart.top
```

## Custom MDX Components

MDX components are defined in `src/app/(marketing)/components/MDXComponents.tsx`. You can add custom components:

```typescript
export const MDXComponents = {
  // ... existing components
  CustomComponent: ({ children }) => (
    <div className="custom">{children}</div>
  ),
};
```

Then use in MDX:

```mdx
<CustomComponent>
  This is custom content
</CustomComponent>
```

## Static Generation

All marketing pages are statically generated at build time for optimal performance and SEO. Blog posts are also statically generated.

## Adding New Content Types

To add new content types (e.g., docs, guides):

1. Create directory in `content/`:
   ```bash
   mkdir -p content/docs
   ```

2. Create route group or pages:
   ```bash
   mkdir -p src/app/(marketing)/docs/[slug]
   ```

3. Use `getContentBySlug("docs", slug)` to load content

## Best Practices

1. **Always include front matter** in MDX files
2. **Use descriptive slugs** for URLs
3. **Add images** for better social sharing
4. **Keep content updated** - update `updatedAt` when editing
5. **Use semantic HTML** - MDX components handle this
6. **Optimize images** - use Next.js Image component in custom MDX components

## Deployment

The marketing site works seamlessly with your existing Netlify deployment. All routes are automatically included in the build.

## Future Enhancements

- [ ] Add RSS feed for blog
- [ ] Add search functionality
- [ ] Add content categories/taxonomy
- [ ] Add related posts
- [ ] Add reading progress indicator
- [ ] Add social sharing buttons
- [ ] Add comments system (optional)
