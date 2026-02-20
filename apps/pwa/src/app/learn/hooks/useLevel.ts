import { useState } from "react";

const LEVEL_STORAGE_KEY = "learn_level";
const DEFAULT_LEVEL = "A1";
const AVAILABLE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export type Level = typeof AVAILABLE_LEVELS[number];

export function useLevel() {
  // Initialize state from localStorage if available
  const [level, setLevelState] = useState<Level>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LEVEL_STORAGE_KEY);
      if (stored && AVAILABLE_LEVELS.includes(stored as Level)) {
        return stored as Level;
      }
    }
    return DEFAULT_LEVEL;
  });

  const setLevel = (newLevel: Level) => {
    setLevelState(newLevel);
    if (typeof window !== "undefined") {
      localStorage.setItem(LEVEL_STORAGE_KEY, newLevel);
    }
  };

  return {
    level,
    setLevel,
    availableLevels: AVAILABLE_LEVELS,
  };
}

