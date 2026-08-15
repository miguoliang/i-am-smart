/** Portable lesson content — framework never hardcodes textbook words. */

export const PACK_SCHEMA = 'peilian-pack/v1' as const

export interface WordDef {
  id: string
  english: string
  chinese: string
  /**
   * Image reference:
   * - bundled path: `cards/apple.png`
   * - remote URL: `https://…`
   * - embedded: `data:image/…;base64,…`
   */
  image: string
  /** Indefinite article for sentence frames */
  article: 'a' | 'an'
}

export interface LessonPack {
  id: string
  titleZh: string
  titleEn: string
  blurb: string
  words: WordDef[]
  /** Present on user-imported / created packs */
  source?: 'builtin' | 'custom'
  /** ISO timestamp when last changed (local or cloud) */
  updatedAt?: string
  /** True when this revision exists on Supabase */
  cloudSynced?: boolean
}

/** On-disk / import JSON shape (may omit runtime-only fields). */
export interface ContentPackFile {
  schema: typeof PACK_SCHEMA
  id: string
  titleZh: string
  titleEn?: string
  blurb?: string
  words: Array<{
    id?: string
    english: string
    chinese: string
    article?: 'a' | 'an'
    image?: string
  }>
}

export function withArticle(word: WordDef): string {
  return `${word.article} ${word.english}`
}

export function guessArticle(english: string): 'a' | 'an' {
  const first = english.trim().toLowerCase()[0]
  return first && 'aeiou'.includes(first) ? 'an' : 'a'
}

export function slugId(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return base || `word-${Date.now().toString(36)}`
}
