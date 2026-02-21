interface RatingButtonsProps {
  onRate: (quality: number) => void;
}

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <div className="mt-6 md:mt-12 grid grid-cols-2 gap-4 md:gap-6 w-full max-w-md">
      <button
        onClick={() => onRate(1)}
        className="py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-rose-500 hover:bg-rose-600 text-white shadow-xl"
      >
        再看看 ✗
      </button>
      <button
        onClick={() => onRate(4)}
        className="py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl"
      >
        会了 ✓
      </button>
    </div>
  );
}
