interface MisrememberButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function MisrememberButton({ onClick, disabled }: MisrememberButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-5 md:py-8 text-lg md:text-2xl font-bold rounded-2xl transition transform active:scale-95 hover:scale-105 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-xl"
      aria-label="记错了"
    >
      记错了
    </button>
  );
}
