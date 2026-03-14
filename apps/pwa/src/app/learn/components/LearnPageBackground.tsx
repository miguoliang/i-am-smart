"use client";

import {
  LEVEL_PALETTES,
  getTextureCells,
  TEXTURE_GRID,
  type PaletteKey,
} from "../lib/learnBackground";

interface LearnPageBackgroundProps {
  children: React.ReactNode;
  /** Label shown in texture (e.g. "KET", "PET", "四级"). Default "KET". */
  levelLabel?: string;
  /** Palette key for background and texture colors. Default "default". */
  paletteKey?: PaletteKey;
}

export function LearnPageBackground({
  children,
  levelLabel = "KET",
  paletteKey = "default",
}: LearnPageBackgroundProps) {
  const palette = LEVEL_PALETTES[paletteKey] ?? LEVEL_PALETTES.default;
  const cells = getTextureCells(levelLabel);

  return (
    <div className="learn-page-bg-root min-h-dvh w-full overscroll-y-none relative flex flex-col items-center justify-center p-4">
      <style>{`
        .learn-page-bg-root { --learn-bg: ${palette.bgLight}; --learn-texture: ${palette.textureLight}; --learn-texture-opacity: ${palette.textureOpacityLight}; }
        .dark .learn-page-bg-root { --learn-bg: ${palette.bgDark}; --learn-texture: ${palette.textureDark}; --learn-texture-opacity: ${palette.textureOpacityDark}; }
      `}</style>
      <div
        className="absolute inset-0 min-h-dvh w-full"
        style={{ backgroundColor: "var(--learn-bg)" }}
      />

      {/* Texture layer: grid with formula-based rotation and scale (regular + varied) */}
      <div
        className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none select-none grid place-items-center"
        style={{
          gridTemplateColumns: `repeat(${TEXTURE_GRID.COLS}, 1fr)`,
          gridTemplateRows: `repeat(${TEXTURE_GRID.ROWS}, 1fr)`,
        }}
        aria-hidden
      >
        {cells.map((cell, i) => (
          <span
            key={i}
            className="flex items-center justify-center text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
            style={{
              color: "var(--learn-texture)",
              opacity: "var(--learn-texture-opacity)",
              transform: `rotate(${cell.rotationDeg}deg) scale(${cell.scale})`,
            }}
          >
            {cell.label}
          </span>
        ))}
      </div>
      <div className="relative z-0 w-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
