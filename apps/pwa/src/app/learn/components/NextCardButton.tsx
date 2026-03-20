interface NextCardButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function NextCardButton({ onClick, disabled }: NextCardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-xl"
      aria-label="下一个"
    >
      下一个
    </button>
  );
}
