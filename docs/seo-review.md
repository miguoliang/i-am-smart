# SEO Settings Review for Marketing Website

**Review Date**: 2026-02-18  
**Site URL**: https://iamsmart.top  
**Framework**: Next.js 15+ (App Router)

## Executive Summary

The marketing website has a solid SEO foundation with structured metadata, sitemap, robots.txt, and schema.org structured data. However, there are several areas for improvement to enhance search engine visibility and social media sharing.

---

## ✅ Current SEO Strengths

### 1. **Metadata System**
- ✅ Centralized metadata generation via `src/lib/seo/metadata.ts`
- ✅ Consistent use across marketing pages
- ✅ Support for Open Graph and Twitter Cards
- ✅ Canonical URLs configured
- ✅ Robots meta tags (index/follow) support

### 2. **Structured Data (Schema.org)**
- ✅ Organization schema implemented
- ✅ Website schema with search action
- ✅ Article schema available
- ✅ Breadcrumb schema available
- ✅ Properly injected via JSON-LD

### 3. **Technical SEO**
- ✅ `robots.ts` configured with proper disallow rules
- ✅ `sitemap.ts` implemented (though minimal)
- ✅ Language attribute set (`lang="zh"`)
- ✅ Semantic HTML structure

### 4. **Marketing Pages**
- ✅ Homepage (`/`)
- ✅ Terms (`/terms`)
- ✅ Privacy (`/privacy`)
- ✅ About (`/about`)
- ✅ All pages have proper metadata

---

## ⚠️ Issues & Recommendations

### 🔴 Critical Issues

#### 1. **Missing Open Graph Image**
**Issue**: 
- Metadata references `/og-image.png` but file doesn't exist in `public/`
- Only PWA icons found: `pwa-icon.svg`, `pwa-icon-28.png`, `pwa-icon-108.png`

**Impact**: 
- Poor social media sharing appearance
- Missing visual preview on platforms like WeChat, Weibo, Facebook

**Recommendation**:
```bash
# Create og-image.png (1200x630px) in public/
# Should include:
# - Site name: "聪明的背单词工具"
# - Tagline: "用碎片时间，提英语成绩"
# - Visual branding
```

#### 2. **Missing Favicon & App Icons**
**Issue**: 
- No `favicon.ico` or `icon.png` in `public/`
- No Apple touch icons
- No manifest icons referenced

**Impact**: 
- Poor browser tab appearance
- Missing PWA icon for home screen

**Recommendation**:
```typescript
// Add to src/app/layout.tsx or use Next.js 13+ icon system
// Create files:
// - public/favicon.ico (32x32)
// - public/icon.png (512x512)
// - public/apple-icon.png (180x180)
```

#### 3. **Incomplete Sitemap**
**Issue**: 
- `sitemap.ts` only includes homepage (`/`)
- Missing all marketing pages

**Current**:
```typescript
const entries: SitemapEntry[] = [
  { url: "/", changeFrequency: "daily", priority: 1.0 },
];
```

**Recommendation**:
```typescript
const entries: SitemapEntry[] = [
  { url: "/", changeFrequency: "daily", priority: 1.0 },
  { url: "/about", changeFrequency: "monthly", priority: 0.8 },
  { url: "/features", changeFrequency: "monthly", priority: 0.8 },
  { url: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { url: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { url: "/privacy", changeFrequency: "yearly", priority: 0.3 },
];
```

### 🟡 Important Improvements

#### 4. **Missing Homepage Metadata**
**Issue**: 
- Homepage (`src/app/(marketing)/page.tsx`) doesn't have page-specific metadata
- Uses layout metadata only

**Recommendation**:
```typescript
// Add to src/app/(marketing)/page.tsx
export const metadata: Metadata = generateSEOMetadata({
  title: "聪明的背单词工具 - 用碎片时间，提英语成绩",
  description: "随时随地，科学复习，无需下载，多端同步。基于SM-2算法的英语学习应用，支持A1-C2全级别单词，帮助您终身掌握知识。",
  keywords: [
    "英语学习",
    "背单词",
    "间隔重复",
    "SM-2算法",
    "碎片时间学习",
    "多端同步",
    "PWA应用",
    "语言学习工具",
  ],
  openGraph: {
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
});
```

#### 5. **Missing Social Media Links**
**Issue**: 
- `structured-data.ts` has empty `sameAs` array
- No social media presence declared

**Current**:
```typescript
sameAs: [
  // Add social media links here
],
```

**Recommendation**:
```typescript
sameAs: [
  "https://weibo.com/your-account", // If available
  "https://twitter.com/your-account", // If available
  "https://github.com/miguoliang/be-it-forever", // GitHub repo
],
```

#### 6. **Missing Logo Reference**
**Issue**: 
- Structured data references `/logo.png` but file doesn't exist
- Should be a square logo (at least 112x112px)

**Recommendation**:
- Create `public/logo.png` (recommended: 512x512px)
- Or update structured data to use existing PWA icon

#### 7. **No Canonical URLs for Marketing Pages**
**Issue**: 
- Marketing pages don't specify canonical URLs
- May cause duplicate content issues

**Recommendation**: Add canonical to each marketing page:
```typescript
export const metadata: Metadata = generateSEOMetadata({
  // ... other metadata
  canonical: `${siteUrl}/about`, // For about page
});
```

#### 8. **Missing hreflang Tags**
**Issue**: 
- Only Chinese (`zh`) language set
- No alternate language versions if planning internationalization

**Recommendation**: If adding English version:
```typescript
alternates: {
  canonical: canonical || siteUrl,
  languages: {
    'zh-CN': `${siteUrl}/zh`,
    'en': `${siteUrl}/en`,
  },
},
```

### 🟢 Nice-to-Have Enhancements

#### 9. **Missing JSON-LD for Homepage**
**Issue**: 
- Homepage doesn't include specific structured data
- Could add FAQ schema, Product schema, or Service schema

**Recommendation**: Add FAQ schema for common questions:
```typescript
// src/lib/seo/structured-data.ts
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>
): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
```

#### 10. **Missing Meta Tags for Chinese Search Engines**
**Issue**: 
- No Baidu-specific meta tags
- No 360 Search optimization

**Recommendation**: Add Baidu-specific tags:
```typescript
// In metadata.ts or layout.tsx
<meta name="baidu-site-verification" content="your-verification-code" />
<meta name="360-site-verification" content="your-verification-code" />
```

#### 11. **No robots.txt Physical File**
**Issue**: 
- Only `robots.ts` exists (Next.js generates it)
- May want a physical file for better control

**Recommendation**: Create `public/robots.txt` if needed:
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /operator/
Disallow: /learn/
Disallow: /stats/
Disallow: /feedback/

Sitemap: https://iamsmart.top/sitemap.xml
```

#### 12. **Missing Analytics Integration Review**
**Current**: 
- Baidu Analytics implemented ✅
- No Google Analytics visible

**Recommendation**: 
- Consider adding Google Analytics 4 for broader coverage
- Add Google Search Console verification
- Add Baidu Webmaster Tools verification

---

## 📋 Action Items Priority

### High Priority (Do First)
1. ✅ Create `og-image.png` (1200x630px)
2. ✅ Add favicon and app icons
3. ✅ Expand sitemap with all marketing pages
4. ✅ Add homepage-specific metadata
5. ✅ Create/update logo.png for structured data

### Medium Priority
6. ✅ Add canonical URLs to marketing pages
7. ✅ Fill in social media links in structured data
8. ✅ Add FAQ structured data (if applicable)
9. ✅ Add Baidu/360 verification meta tags

### Low Priority
10. ✅ Add hreflang tags (if internationalizing)
11. ✅ Create physical robots.txt (optional)
12. ✅ Add Google Analytics (if needed)

---

## 📊 SEO Checklist

### Technical SEO
- [x] Robots.txt configured
- [x] Sitemap.xml generated
- [ ] Sitemap includes all pages
- [x] Canonical URLs
- [ ] hreflang tags (if needed)
- [x] Language attribute
- [x] Mobile-friendly (responsive)

### On-Page SEO
- [x] Title tags optimized
- [x] Meta descriptions
- [x] H1 tags on pages
- [x] Semantic HTML
- [ ] Image alt text (verify)
- [ ] Internal linking structure

### Structured Data
- [x] Organization schema
- [x] Website schema
- [x] Article schema (available)
- [ ] FAQ schema (optional)
- [ ] Product/Service schema (optional)

### Social Media
- [x] Open Graph tags
- [x] Twitter Card tags
- [ ] OG image exists
- [ ] Social media links in structured data

### Performance
- [x] PWA enabled
- [ ] Image optimization (verify)
- [ ] Core Web Vitals (monitor)

---

## 🔗 Useful Resources

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Schema.org Documentation](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Google Search Central](https://developers.google.com/search)
- [Baidu Webmaster Tools](https://ziyuan.baidu.com/)

---

## 📝 Notes

- Site uses Chinese language (`zh`) - ensure all content is optimized for Chinese search engines
- Baidu Analytics is implemented - good for Chinese market
- PWA features are enabled - good for mobile SEO
- Consider adding WeChat-specific meta tags if targeting WeChat users

---

**Review Completed**: 2026-02-18  
**Next Review**: Recommended quarterly or after major changes
