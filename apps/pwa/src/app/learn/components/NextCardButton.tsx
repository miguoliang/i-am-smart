interface NextCardButtonProps {
  onClick: () => void;
  disabled?: boolean;
  showKeyHint?: boolean;
}

export function NextCardButton({ onClick, disabled, showKeyHint }: NextCardButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-5 md:py-8 text-xl md:text-3xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-xl sm:flex-row sm:gap-2"
      aria-label="下一个"
    >
      <span>下一个</span>
      {showKeyHint ? (
        <span className="font-mono text-sm md:text-2xl font-normal text-white/90">(D)</span>
      ) : null}
    </button>
  );
}
