interface RatingButtonsProps {
  onRate: (quality: number) => void;
}

export function RatingButtons({ onRate }: RatingButtonsProps) {
  const buttons = [
    { quality: 0, label: "完全忘记", color: "bg-red-500 hover:bg-red-600" },
    { quality: 3, label: "一般", color: "bg-yellow-500 hover:bg-yellow-600" },
    { quality: 5, label: "完美", color: "bg-green-500 hover:bg-green-600" },
  ];

  return (
    <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-2xl">
      {buttons.map(({ quality, label, color }) => (
        <button
          key={quality}
          onClick={() => onRate(quality)}
          className={`py-8 text-4xl font-bold rounded-2xl transition transform hover:scale-110 ${color} text-white shadow-xl`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

