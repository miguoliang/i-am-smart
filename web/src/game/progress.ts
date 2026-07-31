import { FOOD_WORDS } from '../data/words'

/** Every block of this many clears: either all-image (before any word) or review with learned words. */
export const LEVELS_PER_BLOCK = 5

const STORAGE_KEY = 'cititu-progress-v2'
const ALL_WORD_IDS = FOOD_WORDS.map((w) => w.id)

export interface ProgressState {
  /** Successfully cleared play levels. */
  clearedLevels: number
  /** Words the player has chosen to learn. */
  unlockedWords: string[]
}

export interface PlaySetup {
  /** No English text tiles yet. */
  imageOnly: boolean
  /** Words that may appear as English text tiles. */
  textWordIds: string[]
  label: string
  /** Prefer these ids when building goals. */
  goalFocusIds: string[]
}

export type NextStep =
  | { kind: 'play'; setup: PlaySetup }
  | { kind: 'pick'; candidates: string[] }
  | { kind: 'complete' }

export function createProgress(): ProgressState {
  return {
    clearedLevels: 0,
    unlockedWords: [],
  }
}

export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createProgress()
    const parsed = JSON.parse(raw) as Partial<ProgressState>
    const unlockedWords = Array.isArray(parsed.unlockedWords)
      ? parsed.unlockedWords.filter((id): id is string => ALL_WORD_IDS.includes(id))
      : []
    return {
      clearedLevels: Math.max(0, Number(parsed.clearedLevels) || 0),
      unlockedWords,
    }
  } catch {
    return createProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function unlockWord(state: ProgressState, wordId: string): ProgressState {
  if (!ALL_WORD_IDS.includes(wordId) || state.unlockedWords.includes(wordId)) {
    return state
  }
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

export function remainingWordIds(state: ProgressState): string[] {
  return ALL_WORD_IDS.filter((id) => !state.unlockedWords.includes(id))
}

/**
 * Progression:
 * - Levels 1–5: all images
 * - Pick one picture and learn its word
 * - Next 5 levels: that word can appear as text
 * - Pick another picture, learn, next 5 levels… until all words are learned
 */
export function getNextStep(state: ProgressState): NextStep {
  const unlocked = state.unlockedWords.length
  const blocksDone = Math.floor(state.clearedLevels / LEVELS_PER_BLOCK)

  // After every 5 clears, if we still owe a newly learned word for that block, pick one.
  if (unlocked < blocksDone) {
    const candidates = remainingWordIds(state)
    if (candidates.length === 0) return { kind: 'complete' }
    return { kind: 'pick', candidates }
  }

  const levelNum = state.clearedLevels + 1
  const imageOnly = unlocked === 0

  return {
    kind: 'play',
    setup: {
      imageOnly,
      textWordIds: [...state.unlockedWords],
      goalFocusIds: imageOnly ? ALL_WORD_IDS : [...state.unlockedWords],
      label: `第 ${levelNum} 关`,
    },
  }
}
