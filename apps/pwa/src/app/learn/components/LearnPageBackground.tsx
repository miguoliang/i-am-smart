"use client";

/**
 * Full-viewport background for the learn page: solid comfortable color + KET/PET text texture.
 * No gradient; texture uses very low opacity for a subtle, eye-friendly look.
 */
const TEXTURE_WORDS = ["KET", "PET"] as const;
const COLS = 10;
const ROWS = 8;

export function LearnPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full overscroll-y-none relative flex flex-col items-center justify-center p-4 bg-[#f5f2ee] dark:bg-[#1c1917]">
      {/* Texture layer: repeated KET / PET at very low opacity, spread across viewport */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none grid place-items-center"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
        aria-hidden
      >
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <span
            key={i}
            className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[#2d2a26] dark:text-stone-500 opacity-[0.04] dark:opacity-[0.045]"
            style={{
              transform: `rotate(${(i % 5) * 4 - 8}deg)`,
            }}
          >
            {TEXTURE_WORDS[i % TEXTURE_WORDS.length]}
          </span>
        ))}
      </div>
      <div className="relative z-0 w-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
