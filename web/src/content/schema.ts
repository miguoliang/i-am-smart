import {
  PACK_SCHEMA,
  guessArticle,
  hydrateSentence,
  parsePos,
  slugId,
  type ContentPackFile,
  type LessonPack,
  type SentenceDef,
  type WordDef,
} from './types'

export const MAX_WORDS = 40
export const MAX_SENTENCES = 40

export class PackParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PackParseError'
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new PackParseError('课包必须是 JSON 对象')
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

function optionalString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeWord(raw: unknown): WordDef {
  const obj = asRecord(raw)
  const english = requireString(obj, 'english')
  const chinese = optionalString(obj.chinese)
  const id =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : slugId(english)
  const pos = parsePos(obj.pos)
  const article =
    obj.article === 'a' || obj.article === 'an'
      ? obj.article
      : guessArticle(english)
  const image =
    typeof obj.image === 'string' && obj.image.trim()
      ? obj.image.trim()
      : ''
  return { id, english, chinese, pos, article, image }
}

function normalizeSentence(raw: unknown): SentenceDef {
  const obj = asRecord(raw)
  const english = requireString(obj, 'english')
  return hydrateSentence({
    id: optionalString(obj.id) || undefined,
    english,
    chinese: optionalString(obj.chinese),
    answer: optionalString(obj.answer),
    answerZh: optionalString(obj.answerZh),
  })
}

function uniqueIds(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new PackParseError(`${label} id 不能重复`)
  }
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
      : '一节外教课记下的词汇和问答'

  const rawWords = obj.words
  const rawSentences = obj.sentences
  if (rawWords !== undefined && !Array.isArray(rawWords)) {
    throw new PackParseError('words 必须是数组')
  }
  if (rawSentences !== undefined && !Array.isArray(rawSentences)) {
    throw new PackParseError('sentences 必须是数组')
  }

  const words = (rawWords ?? []).map((w) => normalizeWord(w))
  const sentences = (rawSentences ?? []).map((s) => normalizeSentence(s))

  if (words.length > MAX_WORDS) {
    throw new PackParseError(`单课最多 ${MAX_WORDS} 个词`)
  }
  if (sentences.length > MAX_SENTENCES) {
    throw new PackParseError(`单课最多 ${MAX_SENTENCES} 组问答`)
  }
  uniqueIds(words.map((w) => w.id), '词条')
  uniqueIds(sentences.map((s) => s.id), '问答')

  const courseId = optionalString(obj.courseId)
  const scheduledOn = optionalString(obj.scheduledOn)

  return {
    id,
    titleZh,
    titleEn,
    blurb,
    words,
    sentences,
    source: 'custom',
    ...(courseId ? { courseId } : {}),
    ...(scheduledOn ? { scheduledOn } : {}),
  }
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

function omitEmptyChinese<T extends { chinese: string }>(
  item: T,
): Omit<T, 'chinese'> & { chinese?: string } {
  if (!item.chinese) {
    const { chinese: _omit, ...rest } = item
    return rest
  }
  return item
}

function omitEmptyFields<T extends Record<string, string | undefined>>(
  item: T,
  keys: (keyof T)[],
): T {
  const next = { ...item }
  for (const key of keys) {
    if (!next[key]) delete next[key]
  }
  return next
}

export function toContentPackFile(pack: LessonPack): ContentPackFile {
  return {
    schema: PACK_SCHEMA,
    id: pack.id,
    titleZh: pack.titleZh,
    titleEn: pack.titleEn,
    blurb: pack.blurb,
    ...(pack.courseId ? { courseId: pack.courseId } : {}),
    ...(pack.scheduledOn ? { scheduledOn: pack.scheduledOn } : {}),
    words: pack.words.map((w) =>
      omitEmptyChinese({
        id: w.id,
        english: w.english,
        chinese: w.chinese,
        pos: w.pos,
        article: w.article,
        ...(w.image ? { image: w.image } : {}),
      }),
    ),
    sentences: pack.sentences.map((s) =>
      omitEmptyFields(
        omitEmptyChinese({
          id: s.id,
          english: s.english,
          chinese: s.chinese,
          answer: s.answer,
          answerZh: s.answerZh,
        }),
        ['answer', 'answerZh'],
      ),
    ),
  }
}

export function downloadPackJson(pack: LessonPack): void {
  const payload = JSON.stringify(toContentPackFile(pack), null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${pack.id || 'class'}.peilian.json`
  a.click()
  URL.revokeObjectURL(url)
}
