import {
  POS_LABEL_ZH,
  guessArticle,
  slugId,
  type LessonPack,
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

export interface WordForm {
  editIndex: number | null
  english: string
  chinese: string
  pos: WordPos
  article: 'a' | 'an'
  imageDataUrl: string
}

export interface PackDraft {
  /** Existing custom pack id; empty means create a new pack on save. */
  packId: string
  titleZh: string
  titleEn: string
  blurb: string
  words: DraftWord[]
  wordForm: WordForm
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

export function emptyDraft(): PackDraft {
  return {
    packId: '',
    titleZh: '',
    titleEn: '',
    blurb: '',
    words: [],
    wordForm: emptyWordForm(),
    error: '',
  }
}

export function ensureUniqueWordIds(words: WordDef[]): WordDef[] {
  const seen = new Set<string>()
  return words.map((word) => {
    const base = word.id.trim() || slugId(word.english)
    let next = base
    let n = 2
    while (seen.has(next)) {
      next = `${base}-${n}`
      n += 1
    }
    seen.add(next)
    return { ...word, id: next }
  })
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
    words: pack.words.map((w) => ({
      id: w.id,
      english: w.english,
      chinese: w.chinese,
      pos: w.pos,
      article: w.article,
      imageDataUrl: w.image,
    })),
    wordForm: emptyWordForm(),
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
  return {
    id: draft.packId || `custom-${slugId(titleZh)}-${Date.now().toString(36)}`,
    titleZh,
    titleEn: draft.titleEn.trim() || titleZh,
    blurb: draft.blurb.trim() || '自定义课程内容',
    source: 'custom',
    words,
    cloudSynced: false,
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

export function posExtra(word: DraftWord): string {
  const label = POS_LABEL_ZH[word.pos]
  return word.pos === 'noun' ? `${label} · ${word.article}` : label
}

export function moveDraftWord(
  words: DraftWord[],
  index: number,
  dir: -1 | 1,
): DraftWord[] {
  const next = index + dir
  if (next < 0 || next >= words.length) return words
  const copy = words.slice()
  const [item] = copy.splice(index, 1)
  if (!item) return words
  copy.splice(next, 0, item)
  return copy
}
