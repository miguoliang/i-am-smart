/**
 * Single source of truth for on-screen look. Edit here to restyle all batch output.
 */
export const wordVideoTheme = {
  width: 1080,
  height: 1920,
  fps: 30,
  maxDurationSeconds: 15,
  colors: {
    backgroundTop: "#0f172a",
    backgroundBottom: "#1e293b",
    word: "#f8fafc",
    chinese: "#94a3b8",
    example: "#e2e8f0",
    levelBadge: "#3b82f6",
    accent: "#38bdf8",
  },
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  layout: {
    paddingX: 72,
    wordSizePx: 112,
    wordSizePxSecondary: 72,
    chineseSizePx: 52,
    exampleSizePx: 44,
    lineHeight: 1.35,
  },
  /** Relative cut points within [0,1] of timeline (by time, not frames) */
  timing: {
    /** End of “word only” hero segment */
    wordOnlyEnd: 0.22,
    /** End of “+ Chinese” segment; remainder is example */
    chineseEnd: 0.48,
  },
} as const;
