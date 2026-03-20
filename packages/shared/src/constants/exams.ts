/**
 * Exam target definitions mapping to CEFR levels.
 * Users select an exam target; the system maps it to CEFR levels for card filtering.
 *
 * Word scope is **cumulative** from A1 upward (except KET, which is only A1–A2).
 * **Merged scopes:** 相同 `levels` 的考试共用一套词库统计（PET 与四级、雅思与托福各共用一档）。
 */
import type { Level } from './levels';
import { AVAILABLE_LEVELS } from './levels';

/** Inclusive slice of CEFR order from `low` through `high` (e.g. A1→B2 = KET+PET bands). */
function examScopeLevels(low: Level, high: Level): Level[] {
  const i = AVAILABLE_LEVELS.indexOf(low);
  const j = AVAILABLE_LEVELS.indexOf(high);
  if (i === -1 || j === -1 || i > j) {
    return ["A1", "A2"];
  }
  return [...AVAILABLE_LEVELS.slice(i, j + 1)];
}

/**
 * 合并后的词库等级范围。考试通过引用同一 scope 共享抽词与统计口径。
 */
export const EXAM_WORD_SCOPES = {
  /** KET：仅 A1–A2 */
  ket: examScopeLevels("A1", "A2"),
  /** PET、四级：含 KET，至 B2 */
  throughB2: examScopeLevels("A1", "B2"),
  /** 六级：至 C1 */
  throughC1: examScopeLevels("A1", "C1"),
  /** 雅思、托福：全六级 A1–C2 */
  throughC2: examScopeLevels("A1", "C2"),
} as const;

export type ExamWordScopeKey = keyof typeof EXAM_WORD_SCOPES;

/** UI / 配置顺序：由小到大词库 */
export const EXAM_SCOPE_ORDER: ExamWordScopeKey[] = [
  "ket",
  "throughB2",
  "throughC1",
  "throughC2",
];

function levelsFromScope(key: ExamWordScopeKey): Level[] {
  return [...EXAM_WORD_SCOPES[key]];
}

export interface ExamTarget {
  id: string;        // unique key, e.g. "ket"
  name: string;      // display name, e.g. "KET"
  fullName: string;  // e.g. "剑桥KET (A1-A2)"
  /** All CEFR bands whose words are included (cumulative scope for this target). */
  levels: Level[];
  /** 合并词库档位：同档考试的抽词与统计口径一致。 */
  scopeKey: ExamWordScopeKey;
  isFree: boolean;   // available in free tier
}

export const EXAM_TARGETS: ExamTarget[] = [
  { id: "ket",    name: "KET",    fullName: "剑桥KET",     levels: levelsFromScope("ket"),       scopeKey: "ket",       isFree: true },
  { id: "pet",    name: "PET",    fullName: "剑桥PET",     levels: levelsFromScope("throughB2"), scopeKey: "throughB2", isFree: false },
  { id: "cet4",   name: "四级",   fullName: "大学英语四级", levels: levelsFromScope("throughB2"), scopeKey: "throughB2", isFree: false },
  { id: "cet6",   name: "六级",   fullName: "大学英语六级", levels: levelsFromScope("throughC1"), scopeKey: "throughC1", isFree: false },
  { id: "ielts",  name: "雅思",   fullName: "雅思 IELTS",  levels: levelsFromScope("throughC2"), scopeKey: "throughC2", isFree: false },
  { id: "toefl",  name: "托福",   fullName: "托福 TOEFL",  levels: levelsFromScope("throughC2"), scopeKey: "throughC2", isFree: false },
];

/** 某一词库档位下的考试列表 */
export function listExamsInWordScope(scopeKey: ExamWordScopeKey): ExamTarget[] {
  return EXAM_TARGETS.filter((e) => e.scopeKey === scopeKey);
}

export type ExamTargetId = typeof EXAM_TARGETS[number]["id"];

/**
 * 设置里「选择考试目标」的每一行：同档合并显示（如 PET/四级、雅思/托福）。
 * 写入档案时使用 canonicalExamTargetId（每组在 EXAM_TARGETS 中的第一项）。
 */
export interface ExamPickerEntry {
  scopeKey: ExamWordScopeKey;
  label: string;
  examTargetIds: ExamTargetId[];
  canonicalExamTargetId: ExamTargetId;
  requiresPro: boolean;
}

export const EXAM_PICKER_ENTRIES: ExamPickerEntry[] = EXAM_SCOPE_ORDER.map(
  (scopeKey) => {
    const exams = listExamsInWordScope(scopeKey);
    const examTargetIds = exams.map((e) => e.id as ExamTargetId);
    const canonicalExamTargetId = examTargetIds[0]!;
    const label =
      exams.length === 1 ? exams[0]!.name : exams.map((e) => e.name).join("/");
    const requiresPro = exams.length > 0 && exams.every((e) => !e.isFree);
    return {
      scopeKey,
      label,
      examTargetIds,
      canonicalExamTargetId,
      requiresPro,
    };
  }
);

export const DEFAULT_EXAM_TARGET: ExamTargetId = "ket";

/** Get exam target by id */
export function getExamTarget(id: string): ExamTarget | undefined {
  return EXAM_TARGETS.find(e => e.id === id);
}

/** Get the primary (highest) CEFR level for an exam target */
export function getExamPrimaryLevel(id: string): Level {
  const exam = getExamTarget(id);
  if (!exam) return "A1";
  return exam.levels[exam.levels.length - 1];
}

/** Get all CEFR levels for an exam target */
export function getExamLevels(id: string): Level[] {
  const exam = getExamTarget(id);
  return exam?.levels ?? ["A1"];
}
