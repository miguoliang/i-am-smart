interface RatingButtonsProps {
  onRate: (quality: number) => void;
}

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <>
      <button
        onClick={() => onRate(1)}
        className="flex-1 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-rose-500 hover:bg-rose-600 text-white shadow-xl"
      >
        再看看 ✗
      </button>
      <button
        onClick={() => onRate(4)}
        className="flex-1 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl"
      >
        会了 ✓
      </button>
    </>
  );
}
