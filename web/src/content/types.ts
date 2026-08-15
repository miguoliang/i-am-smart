/** Portable lesson content — framework never hardcodes textbook words. */

export const PACK_SCHEMA = 'peilian-pack/v1' as const

export const WORD_POS = ['noun', 'verb', 'adjective'] as const
export type WordPos = (typeof WORD_POS)[number]

export const POS_LABEL_ZH: Record<WordPos, string> = {
  noun: '名词',
  verb: '动词',
  adjective: '形容词',
}

export interface WordDef {
  id: string
  english: string
  chinese: string
  pos: WordPos
  /**
   * Optional image reference:
   * - bundled path: `cards/apple.png`
   * - remote URL: `https://…`
   * - embedded: `data:image/…;base64,…`
   * Empty for verbs/adjectives (or any word) practiced as a text card.
   */
  image: string
  /** Indefinite article for noun sentence frames */
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
    pos?: WordPos
    article?: 'a' | 'an'
    image?: string
  }>
}

export function parsePos(value: unknown): WordPos {
  return value === 'verb' || value === 'adjective' || value === 'noun'
    ? value
    : 'noun'
}

export function hasImage(word: { image?: string }): boolean {
  return Boolean(word.image?.trim())
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

/** Fill pos/image defaults so older saved packs still run. */
export function hydrateWord(raw: {
  id?: string
  english: string
  chinese: string
  pos?: unknown
  article?: string
  image?: string
}): WordDef {
  return {
    id: raw.id?.trim() || slugId(raw.english),
    english: raw.english,
    chinese: raw.chinese,
    pos: parsePos(raw.pos),
    article: raw.article === 'an' || raw.article === 'a' ? raw.article : guessArticle(raw.english),
    image: raw.image?.trim() || '',
  }
}

export function hydratePack(pack: LessonPack): LessonPack {
  return { ...pack, words: pack.words.map(hydrateWord) }
}

/** KET-level present participle for action frames (He is running). */
export function presentParticiple(verb: string): string {
  const v = verb.trim().toLowerCase()
  if (!v) return v
  if (v.endsWith('ie')) return `${v.slice(0, -2)}ying`
  if (v.endsWith('ee') || v.endsWith('ye')) return `${v}ing`
  if (v.endsWith('e')) return `${v.slice(0, -1)}ing`
  if (v.length <= 4 && /[^aeiou][aeiou][bdfglmnprst]$/.test(v)) {
    return `${v}${v.slice(-1)}ing`
  }
  return `${v}ing`
}
