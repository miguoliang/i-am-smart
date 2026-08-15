import {
  PACK_SCHEMA,
  guessArticle,
  slugId,
  type ContentPackFile,
  type LessonPack,
  type WordDef,
} from './types'

export class PackParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PackParseError'
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PackParseError('词包必须是 JSON 对象')
  }
  return value as Record<string, unknown>
}

function requireString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key]
  if (typeof v !== 'string' || !v.trim()) {
    throw new PackParseError(`缺少或无效字段：${key}`)
  }
  return v.trim()
}

function normalizeWord(raw: unknown, index: number): WordDef {
  const obj = asRecord(raw)
  const english = requireString(obj, 'english')
  const chinese = requireString(obj, 'chinese')
  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : slugId(english)
  const article =
    obj.article === 'a' || obj.article === 'an'
      ? obj.article
      : guessArticle(english)
  const image =
    typeof obj.image === 'string' && obj.image.trim()
      ? obj.image.trim()
      : ''
  if (!image) {
    throw new PackParseError(`第 ${index + 1} 个词「${english}」缺少 image`)
  }
  return { id, english, chinese, article, image }
}

/** Parse and normalize a peilian-pack/v1 JSON document. */
export function parseContentPack(raw: unknown): LessonPack {
  const obj = asRecord(raw)
  const schema = obj.schema
  if (schema !== PACK_SCHEMA) {
    throw new PackParseError(
      `不支持的 schema（需要 ${PACK_SCHEMA}${schema ? `，收到 ${String(schema)}` : ''}）`,
    )
  }
  const id = requireString(obj, 'id')
  const titleZh = requireString(obj, 'titleZh')
  const titleEn =
    typeof obj.titleEn === 'string' && obj.titleEn.trim()
      ? obj.titleEn.trim()
      : titleZh
  const blurb =
    typeof obj.blurb === 'string' && obj.blurb.trim()
      ? obj.blurb.trim()
      : '自定义课程内容'
  if (!Array.isArray(obj.words) || obj.words.length === 0) {
    throw new PackParseError('words 至少需要 1 个词')
  }
  if (obj.words.length > 40) {
    throw new PackParseError('单个词包最多 40 个词')
  }
  const words = obj.words.map((w, i) => normalizeWord(w, i))
  const ids = new Set(words.map((w) => w.id))
  if (ids.size !== words.length) {
    throw new PackParseError('词条 id 不能重复')
  }
  return { id, titleZh, titleEn, blurb, words, source: 'custom' }
}

export function parseContentPackJson(text: string): LessonPack {
  let raw: unknown
  try {
    raw = JSON.parse(text) as unknown
  } catch {
    throw new PackParseError('不是合法 JSON')
  }
  return parseContentPack(raw)
}

export function toContentPackFile(pack: LessonPack): ContentPackFile {
  return {
    schema: PACK_SCHEMA,
    id: pack.id,
    titleZh: pack.titleZh,
    titleEn: pack.titleEn,
    blurb: pack.blurb,
    words: pack.words.map((w) => ({
      id: w.id,
      english: w.english,
      chinese: w.chinese,
      article: w.article,
      image: w.image,
    })),
  }
}

export function downloadPackJson(pack: LessonPack): void {
  const payload = JSON.stringify(toContentPackFile(pack), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pack.id || 'pack'}.peilian.json`
  a.click()
  URL.revokeObjectURL(url)
}
