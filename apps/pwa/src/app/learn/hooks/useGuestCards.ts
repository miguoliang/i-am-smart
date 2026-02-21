import type { Card } from "../types";

/** A small built-in A1 word list for anonymous users. */
const GUEST_WORDS: Pick<Card, "knowledge">[] = [
  { knowledge: { code: "hello", name: "hello", description: "你好", metadata: {} } },
  { knowledge: { code: "goodbye", name: "goodbye", description: "再见", metadata: {} } },
  { knowledge: { code: "thank", name: "thank you", description: "谢谢", metadata: {} } },
  { knowledge: { code: "please", name: "please", description: "请", metadata: {} } },
  { knowledge: { code: "yes", name: "yes", description: "是", metadata: {} } },
  { knowledge: { code: "no", name: "no", description: "不", metadata: {} } },
  { knowledge: { code: "water", name: "water", description: "水", metadata: {} } },
  { knowledge: { code: "food", name: "food", description: "食物", metadata: {} } },
  { knowledge: { code: "friend", name: "friend", description: "朋友", metadata: {} } },
  { knowledge: { code: "family", name: "family", description: "家庭", metadata: {} } },
  { knowledge: { code: "school", name: "school", description: "学校", metadata: {} } },
  { knowledge: { code: "book", name: "book", description: "书", metadata: {} } },
  { knowledge: { code: "time", name: "time", description: "时间", metadata: {} } },
  { knowledge: { code: "day", name: "day", description: "天", metadata: {} } },
  { knowledge: { code: "night", name: "night", description: "夜晚", metadata: {} } },
  { knowledge: { code: "morning", name: "good morning", description: "早上好", metadata: {} } },
  { knowledge: { code: "happy", name: "happy", description: "快乐的", metadata: {} } },
  { knowledge: { code: "big", name: "big", description: "大的", metadata: {} } },
  { knowledge: { code: "small", name: "small", description: "小的", metadata: {} } },
  { knowledge: { code: "love", name: "love", description: "爱", metadata: {} } },
];

const STORAGE_KEY = "guest_progress";
const SIGNUP_PROMPT_THRESHOLD = 10;

interface GuestProgress {
  reviewed: string[]; // knowledge codes that have been reviewed
  total: number;
}

function loadProgress(): GuestProgress {
  if (typeof window === "undefined") return { reviewed: [], total: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { reviewed: [], total: 0 };
}

function saveProgress(progress: GuestProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch { /* ignore */ }
}

/** Build guest cards with fake IDs, filtering out already-reviewed ones. */
export function getGuestCards(): Card[] {
  const progress = loadProgress();
  return GUEST_WORDS
    .filter((w) => !progress.reviewed.includes(w.knowledge.code))
    .map((w, i) => ({
      id: -(i + 1), // negative IDs to distinguish from real cards
      knowledge_code: w.knowledge.code,
      knowledge: w.knowledge,
      next_review_date: new Date().toISOString(),
      reviewed: false,
    }));
}

export function markGuestCardReviewed(code: string) {
  const progress = loadProgress();
  if (!progress.reviewed.includes(code)) {
    progress.reviewed.push(code);
    progress.total = progress.reviewed.length;
    saveProgress(progress);
  }
}

export function getGuestReviewedCount(): number {
  return loadProgress().reviewed.length;
}

export function shouldPromptSignup(): boolean {
  return loadProgress().reviewed.length >= SIGNUP_PROMPT_THRESHOLD;
}

export function clearGuestProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
