import { FOOD_WORDS } from '../data/words'

export const WARMUP_LEVELS = 5
export const REVIEW_LEVELS = 5

const STORAGE_KEY = 'cititu-progress-v1'

export type CampaignPhase = 'warmup' | 'learn' | 'review' | 'complete'

export interface ProgressState {
  /** Successfully cleared play levels (warmup + reviews). */
  clearedLevels: number
  /** Words already taught via the learn screen. */
  unlockedWords: string[]
  /** Stable teaching order for this save. */
  learnOrder: string[]
}

export interface PlaySetup {
  phase: 'warmup' | 'review'
  /** Words that may appear as English text tiles. */
  textWordIds: string[]
  label: string
  /** Prefer these ids when building goals. */
  goalFocusIds: string[]
}

export type NextStep =
  | { kind: 'play'; setup: PlaySetup }
  | { kind: 'learn'; wordId: string }
  | { kind: 'complete' }

function shuffleIds(ids: string[]): string[] {
  const copy = [...ids]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export function createProgress(allWordIds: string[] = FOOD_WORDS.map((w) => w.id)): ProgressState {
  return {
    clearedLevels: 0,
    unlockedWords: [],
    learnOrder: shuffleIds(allWordIds),
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    const base = createProgress()
    const learnOrder =
      Array.isArray(parsed.learnOrder) && parsed.learnOrder.length === base.learnOrder.length
        ? parsed.learnOrder.filter((id): id is string => typeof id === 'string')
        : base.learnOrder
    if (learnOrder.length !== base.learnOrder.length) return createProgress()

    const unlockedWords = Array.isArray(parsed.unlockedWords)
      ? parsed.unlockedWords.filter((id): id is string => learnOrder.includes(id))
      : []

    return {
      clearedLevels: Math.max(0, Number(parsed.clearedLevels) || 0),
      unlockedWords,
      learnOrder,
    }
  } catch {
    return createProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function unlockWord(state: ProgressState, wordId: string): ProgressState {
  if (state.unlockedWords.includes(wordId)) return state
  const next = {
    ...state,
    unlockedWords: [...state.unlockedWords, wordId],
  }
  saveProgress(next)
  return next
}

export function markLevelCleared(state: ProgressState): ProgressState {
  const next = {
    ...state,
    clearedLevels: state.clearedLevels + 1,
  }
  saveProgress(next)
  return next
}

/** What the player should see next based on saved progress. */
export function getNextStep(state: ProgressState): NextStep {
  const totalWords = state.learnOrder.length

  if (state.clearedLevels < WARMUP_LEVELS) {
    const n = state.clearedLevels + 1
    return {
      kind: 'play',
      setup: {
        phase: 'warmup',
        textWordIds: [],
        goalFocusIds: state.learnOrder,
        label: `热身 ${n}/${WARMUP_LEVELS}`,
      },
    }
  }

  const reviewsDone = state.clearedLevels - WARMUP_LEVELS
  const unlocked = state.unlockedWords.length

  if (unlocked < totalWords && reviewsDone >= unlocked * REVIEW_LEVELS) {
    const wordId = state.learnOrder[unlocked]
    if (!wordId) return { kind: 'complete' }
    return { kind: 'learn', wordId }
  }

  if (unlocked === 0) {
    const wordId = state.learnOrder[0]
    if (!wordId) return { kind: 'complete' }
    return { kind: 'learn', wordId }
  }

  if (unlocked >= totalWords && reviewsDone >= unlocked * REVIEW_LEVELS) {
    return { kind: 'complete' }
  }

  const levelInReview = reviewsDone - (unlocked - 1) * REVIEW_LEVELS + 1
  return {
    kind: 'play',
    setup: {
      phase: 'review',
      textWordIds: [...state.unlockedWords],
      goalFocusIds: [...state.unlockedWords],
      label: `复习 ${levelInReview}/${REVIEW_LEVELS} · 已学${unlocked}词`,
    },
  }
}
