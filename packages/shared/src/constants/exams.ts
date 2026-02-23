/**
 * Exam target definitions mapping to CEFR levels.
 * Users select an exam target; the system maps it to CEFR levels for card filtering.
 */
import type { Level } from './levels';

export interface ExamTarget {
  id: string;        // unique key, e.g. "ket"
  name: string;      // display name, e.g. "KET"
  fullName: string;  // e.g. "剑桥KET (A1-A2)"
  levels: Level[];   // CEFR levels included
  isFree: boolean;   // available in free tier
}

export const EXAM_TARGETS: ExamTarget[] = [
  { id: "ket",    name: "KET",    fullName: "剑桥KET",     levels: ["A1", "A2"],             isFree: true },
  { id: "pet",    name: "PET",    fullName: "剑桥PET",     levels: ["B1", "B2"],             isFree: false },
  { id: "cet4",   name: "四级",   fullName: "大学英语四级", levels: ["B1", "B2"],             isFree: false },
  { id: "cet6",   name: "六级",   fullName: "大学英语六级", levels: ["B2", "C1"],             isFree: false },
  { id: "ielts",  name: "雅思",   fullName: "雅思 IELTS",  levels: ["B2", "C1", "C2"],       isFree: false },
  { id: "toefl",  name: "托福",   fullName: "托福 TOEFL",  levels: ["B2", "C1", "C2"],       isFree: false },
];

export type ExamTargetId = typeof EXAM_TARGETS[number]["id"];

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
