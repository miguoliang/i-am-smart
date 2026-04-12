/**
 * Learn page background: **exam target** label for texture text and per-exam color palettes.
 * Never uses CEFR word band (A1–C2) — only the profile’s 考试目标 (defaults to KET).
 * Texture layout uses deterministic math (grid + rotation/scale formulas) for variation with regularity.
 */
import { DEFAULT_EXAM_TARGET, getExamTarget } from "@i-am-smart/shared/constants";

export type PaletteKey =
  | "ket"
  | "pet"
  | "cet4"
  | "cet6"
  | "ielts"
  | "toefl"
  | "default";

export interface LevelPalette {
  bgLight: string;
  bgDark: string;
  textureLight: string;
  textureDark: string;
  textureOpacityLight: number;
  textureOpacityDark: number;
}

/** Per-exam palettes — distinct, comfortable, eye-friendly. */
export const LEVEL_PALETTES: Record<PaletteKey, LevelPalette> = {
  ket: {
    bgLight: "#f5f2ee",
    bgDark: "#1c1917",
    textureLight: "#2d2a26",
    textureDark: "#78716c",
    textureOpacityLight: 0.045,
    textureOpacityDark: 0.05,
  },
  pet: {
    bgLight: "#f0f4ef",
    bgDark: "#1a1f1a",
    textureLight: "#2d3b2d",
    textureDark: "#6b7c6b",
    textureOpacityLight: 0.04,
    textureOpacityDark: 0.048,
  },
  cet4: {
    bgLight: "#eef3f8",
    bgDark: "#151a22",
    textureLight: "#1e2d3d",
    textureDark: "#5c6d82",
    textureOpacityLight: 0.042,
    textureOpacityDark: 0.05,
  },
  cet6: {
    bgLight: "#f0eef5",
    bgDark: "#1a1820",
    textureLight: "#2a2535",
    textureDark: "#6b6578",
    textureOpacityLight: 0.04,
    textureOpacityDark: 0.048,
  },
  ielts: {
    bgLight: "#f8f4eb",
    bgDark: "#1f1c16",
    textureLight: "#3d3525",
    textureDark: "#8b7d65",
    textureOpacityLight: 0.04,
    textureOpacityDark: 0.046,
  },
  toefl: {
    bgLight: "#eaf5f3",
    bgDark: "#141c1a",
    textureLight: "#1a2d2a",
    textureDark: "#5c7a75",
    textureOpacityLight: 0.042,
    textureOpacityDark: 0.05,
  },
  default: {
    bgLight: "#f5f2ee",
    bgDark: "#1c1917",
    textureLight: "#2d2a26",
    textureDark: "#78716c",
    textureOpacityLight: 0.045,
    textureOpacityDark: 0.05,
  },
};

/**
 * Resolve the label shown in the texture (e.g. "KET", "PET", "四级") and palette key for colors.
 * Always derived from **exam target**; missing/blank `examTarget` uses {@link DEFAULT_EXAM_TARGET}.
 */
export function getLevelLabelAndPalette(
  examTarget: string | null | undefined
): { levelLabel: string; paletteKey: PaletteKey } {
  const target = (examTarget?.trim() || DEFAULT_EXAM_TARGET) as PaletteKey | string;
  const exam = getExamTarget(target);
  const levelLabel = exam?.name ?? "KET";
  const paletteKey =
    target in LEVEL_PALETTES ? (target as PaletteKey) : "default";
  return { levelLabel, paletteKey };
}

/** Grid + rotation/scale from row,col for a regular-but-varied pattern. */
const COLS = 10;
const ROWS = 8;
const TAU = Math.PI * 2;

function deg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export interface TextureCell {
  row: number;
  col: number;
  rotationDeg: number;
  scale: number;
  label: string;
}

/**
 * Generate texture cell data: grid positions with deterministic rotation and scale.
 * Formula: rotation uses sin/cos of row/col for smooth variation; scale has subtle variation.
 */
export function getTextureCells(levelLabel: string): TextureCell[] {
  const cells: TextureCell[] = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    // Rotation: smooth wave-like variation, bounded roughly ±18°
    const rotationRad =
      Math.sin((row / ROWS) * TAU * 0.6) * 0.25 +
      Math.cos((col / COLS) * TAU * 0.5) * 0.2;
    const rotationDeg = deg(rotationRad);
    // Scale: gentle variation 0.92–1.08 so not all same size
    const scale =
      1 + 0.08 * Math.sin(row * 1.3 + col * 0.9) * Math.cos(col * 0.7);
    cells.push({
      row,
      col,
      rotationDeg,
      scale,
      label: levelLabel,
    });
  }
  return cells;
}

export const TEXTURE_GRID = { COLS, ROWS };
