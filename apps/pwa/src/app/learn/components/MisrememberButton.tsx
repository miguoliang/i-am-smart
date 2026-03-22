interface MisrememberButtonProps {
  onClick: () => void;
  disabled?: boolean;
  showKeyHint?: boolean;
}

export function MisrememberButton({ onClick, disabled, showKeyHint }: MisrememberButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-5 md:py-8 text-lg md:text-2xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-xl sm:flex-row sm:gap-2"
      aria-label="记错了"
    >
      <span>记错了</span>
      {showKeyHint ? (
        <span className="font-mono text-sm md:text-xl font-normal text-white/90">(A)</span>
      ) : null}
    </button>
  );
}
