/**
 * Shared level constants
 */

export const AVAILABLE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type Level = typeof AVAILABLE_LEVELS[number];

export const DEFAULT_LEVEL: Level = "A1";
