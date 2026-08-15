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
  /** Optional — parent can fill in after class. */
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

/** One classroom sentence the parent wrote down in this class. */
export interface SentenceDef {
  id: string
  english: string
  /** Optional — parent can fill in after class. */
  chinese: string
}

/**
 * One class = one material: words and/or sentences from that lesson.
 * A new class may start empty; the parent fills it in during class.
 */
export interface LessonPack {
  id: string
  titleZh: string
  titleEn: string
  blurb: string
  words: WordDef[]
  sentences: SentenceDef[]
  /** Present on user-imported / created packs */
  source?: 'builtin' | 'custom'
  /** ISO timestamp when last changed (local or cloud) */
  updatedAt?: string
  /** True when this revision exists on Supabase */
  cloudSynced?: boolean
}

export interface ContentPackWordFile {
  id?: string
  english: string
  chinese?: string
  pos?: WordPos
  article?: 'a' | 'an'
  image?: string
}

export interface ContentPackSentenceFile {
  id?: string
  english: string
  chinese?: string
}

/** On-disk / import JSON shape (may omit runtime-only fields). */
export interface ContentPackFile {
  schema: typeof PACK_SCHEMA
  id: string
  titleZh: string
  titleEn?: string
  blurb?: string
  words?: ContentPackWordFile[]
  sentences?: ContentPackSentenceFile[]
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
  chinese?: string
  pos?: unknown
  article?: string
  image?: string
}): WordDef {
  return {
    id: raw.id?.trim() || slugId(raw.english),
    english: raw.english,
    chinese: raw.chinese?.trim() || '',
    pos: parsePos(raw.pos),
    article: raw.article === 'an' || raw.article === 'a' ? raw.article : guessArticle(raw.english),
    image: raw.image?.trim() || '',
  }
}

export function hydrateSentence(raw: {
  id?: string
  english: string
  chinese?: string
}): SentenceDef {
  const english = raw.english.trim()
  return {
    id: raw.id?.trim() || `s-${slugId(english)}`,
    english,
    chinese: raw.chinese?.trim() || '',
  }
}

export function hydratePack(pack: LessonPack): LessonPack {
  return {
    ...pack,
    words: (pack.words ?? []).map(hydrateWord),
    sentences: (pack.sentences ?? []).map(hydrateSentence),
  }
}

export function defaultLessonTitle(date = new Date()): string {
  return `${date.getMonth() + 1}月${date.getDate()}日外教课`
}

export function zhOrPending(chinese: string): string {
  return chinese.trim() || '课后可补'
}

export function packCounts(pack: {
  words?: unknown[]
  sentences?: unknown[]
}): { words: number; sentences: number } {
  return {
    words: pack.words?.length ?? 0,
    sentences: pack.sentences?.length ?? 0,
  }
}

export function packCountLabel(pack: {
  words?: unknown[]
  sentences?: unknown[]
}): string {
  const { words, sentences } = packCounts(pack)
  const parts: string[] = []
  if (words) parts.push(`${words} 词`)
  if (sentences) parts.push(`${sentences} 句`)
  return parts.join(' · ') || '还没记'
}

export function packHasContent(pack: {
  words?: unknown[]
  sentences?: unknown[]
}): boolean {
  const { words, sentences } = packCounts(pack)
  return words + sentences > 0
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
