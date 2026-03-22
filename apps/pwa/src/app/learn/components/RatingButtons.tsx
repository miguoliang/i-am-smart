interface RatingButtonsProps {
  /** 不会 = 1，会了 = 4 — 仅记录选择并显示答案，不提交复习 */
  onChoose: (quality: 1 | 4) => void;
  showKeyHints?: boolean;
}

export function RatingButtons({ onChoose, showKeyHints }: RatingButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onChoose(1)}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-rose-500 hover:bg-rose-600 text-white shadow-xl sm:flex-row sm:gap-2"
        aria-label="不会"
      >
        <span>不会 ✗</span>
        {showKeyHints ? (
          <span className="font-mono text-sm md:text-2xl font-normal text-white/90">(A)</span>
        ) : null}
      </button>
      <button
        type="button"
        onClick={() => onChoose(4)}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl sm:flex-row sm:gap-2"
        aria-label="会了"
      >
        <span>会了 ✓</span>
        {showKeyHints ? (
          <span className="font-mono text-sm md:text-2xl font-normal text-white/90">(D)</span>
        ) : null}
      </button>
    </>
  );
}
