interface SpeakButtonProps {
  onSpeak: () => void;
  showKeyHint?: boolean;
}

export function SpeakButton({ onSpeak, showKeyHint }: SpeakButtonProps) {
  return (
    <button
      type="button"
      onClick={onSpeak}
      className="flex shrink-0 flex-col items-center justify-center gap-0.5 py-5 md:py-8 px-6 md:px-8 text-xl md:text-3xl rounded-2xl transition transform active:scale-95 hover:scale-105 bg-card hover:bg-muted text-foreground shadow-xl border"
      aria-label="播放发音"
    >
      <span aria-hidden>🔊</span>
      {showKeyHint ? (
        <span className="font-mono text-xs md:text-sm font-normal text-muted-foreground">(S)</span>
      ) : null}
    </button>
  );
}
