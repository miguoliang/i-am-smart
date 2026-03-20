interface RatingButtonsProps {
  /** 不会 = 1，会了 = 4 — 仅记录选择并显示答案，不提交复习 */
  onChoose: (quality: 1 | 4) => void;
}

export function RatingButtons({ onChoose }: RatingButtonsProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onChoose(1)}
        className="flex-1 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-rose-500 hover:bg-rose-600 text-white shadow-xl"
        aria-label="不会"
      >
        不会 ✗
      </button>
      <button
        type="button"
        onClick={() => onChoose(4)}
        className="flex-1 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl"
        aria-label="会了"
      >
        会了 ✓
      </button>
    </>
  );
}
