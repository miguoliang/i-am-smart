import { lessonTitleForYmd, scheduledLessonId } from './schedule'
import {
  POS_LABEL_ZH,
  defaultLessonTitle,
  guessArticle,
  slugId,
  type LessonPack,
  type SentenceDef,
  type WordDef,
  type WordPos,
} from './types'

export interface DraftWord {
  id: string
  english: string
  chinese: string
  pos: WordPos
  article: 'a' | 'an'
  imageDataUrl: string
}

export interface DraftSentence {
  id: string
  english: string
  chinese: string
  answer: string
  answerZh: string
}

export interface WordForm {
  editIndex: number | null
  english: string
  chinese: string
  pos: WordPos
  article: 'a' | 'an'
  imageDataUrl: string
}

export interface SentenceForm {
  editIndex: number | null
  english: string
  chinese: string
  answer: string
  answerZh: string
}

export interface PackDraft {
  /** Existing custom pack id; empty means create a new pack on save. */
  packId: string
  titleZh: string
  titleEn: string
  blurb: string
  courseId: string
  scheduledOn: string
  words: DraftWord[]
  sentences: DraftSentence[]
  wordForm: WordForm
  sentenceForm: SentenceForm
  error: string
}

export function emptyWordForm(): WordForm {
  return {
    editIndex: null,
    english: '',
    chinese: '',
    pos: 'noun',
    article: 'a',
    imageDataUrl: '',
  }
}

export function emptySentenceForm(): SentenceForm {
  return {
    editIndex: null,
    english: '',
    chinese: '',
    answer: '',
    answerZh: '',
  }
}

export function emptyDraft(): PackDraft {
  const titleZh = defaultLessonTitle()
  return {
    packId: '',
    titleZh,
    titleEn: '',
    blurb: '',
    courseId: '',
    scheduledOn: '',
    words: [],
    sentences: [],
    wordForm: emptyWordForm(),
    sentenceForm: emptySentenceForm(),
    error: '',
  }
}

export function newEmptyClass(
  opts: {
    titleZh?: string
    titleEn?: string
    blurb?: string
    courseId?: string
    scheduledOn?: string
  } = {},
): LessonPack {
  const scheduledOn = opts.scheduledOn?.trim() || ''
  const courseId = opts.courseId?.trim() || ''
  const titleZh =
    opts.titleZh?.trim() ||
    (scheduledOn ? lessonTitleForYmd(scheduledOn) : defaultLessonTitle())
  const id =
    courseId && scheduledOn
      ? scheduledLessonId(courseId, scheduledOn)
      : `class-${slugId(titleZh)}-${Date.now().toString(36)}`
  return {
    id,
    titleZh,
    titleEn: opts.titleEn?.trim() || titleZh,
    blurb: opts.blurb?.trim() || '上课时再记词汇和问答',
    source: 'custom',
    words: [],
    sentences: [],
    cloudSynced: false,
    ...(courseId ? { courseId } : {}),
    ...(scheduledOn ? { scheduledOn } : {}),
  }
}

/** Live capture: a space or sentence punctuation means it's a sentence. */
export function guessCaptureKind(english: string): 'word' | 'sentence' {
  const text = english.trim()
  if (!text) return 'word'
  if (/\s/.test(text) || /[.?!！？。]$/.test(text)) return 'sentence'
  return 'word'
}

function ensureUniqueIds<T extends { id: string; english: string }>(
  items: T[],
  prefix: string,
): T[] {
  const seen = new Set<string>()
  return items.map((item) => {
    const base = item.id.trim() || `${prefix}${slugId(item.english)}`
    let next = base
    let n = 2
    while (seen.has(next)) {
      next = `${base}-${n}`
      n += 1
    }
    seen.add(next)
    return { ...item, id: next }
  })
}

export function ensureUniqueWordIds(words: WordDef[]): WordDef[] {
  return ensureUniqueIds(words, '')
}

export function ensureUniqueSentenceIds(sentences: SentenceDef[]): SentenceDef[] {
  return ensureUniqueIds(sentences, 's-')
}

export function packToDraft(
  pack: LessonPack,
  opts: { asCopy?: boolean } = {},
): PackDraft {
  const asCopy = Boolean(opts.asCopy)
  return {
    packId: asCopy ? '' : pack.id,
    titleZh: asCopy ? `${pack.titleZh}（副本）` : pack.titleZh,
    titleEn: asCopy ? `${pack.titleEn} copy` : pack.titleEn,
    blurb: pack.blurb,
    courseId: asCopy ? '' : pack.courseId ?? '',
    scheduledOn: asCopy ? '' : pack.scheduledOn ?? '',
    words: pack.words.map((w) => ({
      id: w.id,
      english: w.english,
      chinese: w.chinese,
      pos: w.pos,
      article: w.article,
      imageDataUrl: w.image,
    })),
    sentences: (pack.sentences ?? []).map((s) => ({
      id: s.id,
      english: s.english,
      chinese: s.chinese,
      answer: s.answer ?? '',
      answerZh: s.answerZh ?? '',
    })),
    wordForm: emptyWordForm(),
    sentenceForm: emptySentenceForm(),
    error: '',
  }
}

export function draftToPack(draft: PackDraft): LessonPack {
  const titleZh = draft.titleZh.trim()
  const words = ensureUniqueWordIds(
    draft.words.map((w) => ({
      id: w.id.trim() || slugId(w.english),
      english: w.english.trim(),
      chinese: w.chinese.trim(),
      pos: w.pos,
      article: w.article,
      image: w.imageDataUrl.trim(),
    })),
  )
  const sentences = ensureUniqueSentenceIds(
    draft.sentences.map((s) => ({
      id: s.id.trim() || `s-${slugId(s.english)}`,
      english: s.english.trim(),
      chinese: s.chinese.trim(),
      answer: s.answer.trim(),
      answerZh: s.answerZh.trim(),
    })),
  )
  const courseId = draft.courseId.trim()
  const scheduledOn = draft.scheduledOn.trim()
  return {
    id: draft.packId || `class-${slugId(titleZh)}-${Date.now().toString(36)}`,
    titleZh,
    titleEn: draft.titleEn.trim() || titleZh,
    blurb: draft.blurb.trim() || '一节外教课记下的词汇和问答',
    source: 'custom',
    words,
    sentences,
    cloudSynced: false,
    ...(courseId ? { courseId } : {}),
    ...(scheduledOn ? { scheduledOn } : {}),
  }
}

export function wordFromForm(form: WordForm, existing?: DraftWord): DraftWord {
  const english = form.english.trim()
  return {
    id: existing?.id || slugId(english),
    english,
    chinese: form.chinese.trim(),
    pos: form.pos,
    article: form.pos === 'noun' ? form.article : guessArticle(english),
    imageDataUrl: form.imageDataUrl,
  }
}

export function sentenceFromForm(
  form: SentenceForm,
  existing?: DraftSentence,
): DraftSentence {
  const english = form.english.trim()
  return {
    id: existing?.id || `s-${slugId(english)}`,
    english,
    chinese: form.chinese.trim(),
    answer: form.answer.trim(),
    answerZh: form.answerZh.trim(),
  }
}

export function posExtra(word: DraftWord): string {
  const label = POS_LABEL_ZH[word.pos]
  return word.pos === 'noun' ? `${label} · ${word.article}` : label
}

export function moveDraftItem<T>(items: T[], index: number, dir: -1 | 1): T[] {
  const next = index + dir
  if (next < 0 || next >= items.length) return items
  const copy = items.slice()
  const [item] = copy.splice(index, 1)
  if (!item) return items
  copy.splice(next, 0, item)
  return copy
}

export function moveDraftWord(
  words: DraftWord[],
  index: number,
  dir: -1 | 1,
): DraftWord[] {
  return moveDraftItem(words, index, dir)
}

export function moveDraftSentence(
  sentences: DraftSentence[],
  index: number,
  dir: -1 | 1,
): DraftSentence[] {
  return moveDraftItem(sentences, index, dir)
}
