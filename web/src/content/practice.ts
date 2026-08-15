import {
  POS_LABEL_ZH,
  packCountLabel,
  type LessonPack,
  type SentenceDef,
  type WordDef,
  type WordPos,
} from './types'

export type PracticeMode = 'full' | 'words' | 'sentences' | 'mixed'

export type PracticePhaseId = 'vocab' | 'talk' | 'sentences' | 'review'

export type ReviewItem =
  | { kind: 'word'; word: WordDef }
  | { kind: 'sentence'; sentence: SentenceDef }

export function posCounts(pack: LessonPack): Record<WordPos, number> {
  const counts: Record<WordPos, number> = {
    noun: 0,
    verb: 0,
    adjective: 0,
  }
  for (const word of pack.words) {
    counts[word.pos] += 1
  }
  return counts
}

export function distinctPosCount(pack: LessonPack): number {
  const counts = posCounts(pack)
  return (['noun', 'verb', 'adjective'] as const).filter((pos) => counts[pos] > 0)
    .length
}

/** Narrow a class pack for 分科巩固. */
export function slicePack(
  pack: LessonPack,
  opts: { mode: PracticeMode; pos?: WordPos },
): LessonPack {
  if (opts.mode === 'sentences') {
    return { ...pack, words: [] }
  }
  if (opts.mode === 'words') {
    const words = opts.pos
      ? pack.words.filter((word) => word.pos === opts.pos)
      : pack.words
    return { ...pack, words, sentences: [] }
  }
  return pack
}

/** Merge several classes into one 综合巩固 pack. */
export function mergePacks(
  packs: LessonPack[],
  titles: { titleZh: string; titleEn: string },
): LessonPack {
  const words = packs.flatMap((pack) =>
    pack.words.map((word) => ({ ...word, id: `${pack.id}__${word.id}` })),
  )
  const sentences = packs.flatMap((pack) =>
    pack.sentences.map((sentence) => ({
      ...sentence,
      id: `${pack.id}__${sentence.id}`,
    })),
  )
  return {
    id: 'mixed-review',
    titleZh: titles.titleZh,
    titleEn: titles.titleEn,
    blurb: `${packs.length} 节课 · ${packCountLabel({ words, sentences })}`,
    words,
    sentences,
    source: 'custom',
  }
}

export function shuffleCopy<T>(items: T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const current = copy[i]
    const swap = copy[j]
    if (current === undefined || swap === undefined) continue
    copy[i] = swap
    copy[j] = current
  }
  return copy
}

export function buildReviewItems(
  pack: LessonPack,
  opts: { shuffle: boolean },
): ReviewItem[] {
  const items: ReviewItem[] = [
    ...pack.words.map((word) => ({ kind: 'word' as const, word })),
    ...pack.sentences.map((sentence) => ({
      kind: 'sentence' as const,
      sentence,
    })),
  ]
  return opts.shuffle ? shuffleCopy(items) : items
}

export function phasesForMode(
  pack: LessonPack,
  mode: PracticeMode,
): { id: PracticePhaseId; label: string }[] {
  if (mode === 'mixed') {
    return [{ id: 'review', label: '综合' }]
  }
  if (mode === 'words') {
    const phases: { id: PracticePhaseId; label: string }[] = []
    if (pack.words.length) {
      phases.push({ id: 'vocab', label: '词汇' }, { id: 'talk', label: '开口' })
    }
    phases.push({ id: 'review', label: '巩固' })
    return phases
  }
  if (mode === 'sentences') {
    const phases: { id: PracticePhaseId; label: string }[] = []
    if (pack.sentences.length) {
      phases.push({ id: 'sentences', label: '问答' })
    }
    phases.push({ id: 'review', label: '巩固' })
    return phases
  }
  const phases: { id: PracticePhaseId; label: string }[] = []
  if (pack.words.length) {
    phases.push({ id: 'vocab', label: '词汇' }, { id: 'talk', label: '开口' })
  }
  if (pack.sentences.length) {
    phases.push({ id: 'sentences', label: '问答' })
  }
  phases.push({ id: 'review', label: '巩固' })
  return phases
}

export function firstPhaseForMode(
  pack: LessonPack,
  mode: PracticeMode,
): PracticePhaseId {
  return phasesForMode(pack, mode)[0]?.id ?? 'review'
}

export function phaseAfterForMode(
  pack: LessonPack,
  mode: PracticeMode,
  current: PracticePhaseId,
): PracticePhaseId | 'done' {
  const ids = phasesForMode(pack, mode).map((phase) => phase.id)
  return ids[ids.indexOf(current) + 1] ?? 'done'
}

export function modeLabelZh(
  mode: PracticeMode,
  pos?: WordPos,
): string {
  if (mode === 'mixed') return '综合巩固'
  if (mode === 'sentences') return '分科巩固 · 问答'
  if (mode === 'words' && pos) return `分科巩固 · ${POS_LABEL_ZH[pos]}`
  if (mode === 'words') return '分科巩固 · 词汇'
  return '完整过一遍'
}
