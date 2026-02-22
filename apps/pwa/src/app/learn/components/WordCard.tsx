import { Knowledge } from '../types';
import { CardContent } from './CardContent';

interface WordCardProps {
  knowledge: Knowledge;
  answerRevealed: boolean;
  onRevealAnswer: () => void;
  onSpeak?: (text: string, lang: "en-US" | "en-GB") => void;
}

export function WordCard({ knowledge, answerRevealed, onRevealAnswer, onSpeak }: WordCardProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-3xl shadow-2xl bg-card min-h-[50vh] md:min-h-96 flex flex-col items-center justify-center p-8 md:p-12">
        {/* Word + pronunciation (always visible) */}
        <CardContent side="front" knowledge={knowledge} className="w-full" onSpeak={onSpeak} />

        {/* Reveal answer button */}
        {!answerRevealed && (
          <button
            onClick={onRevealAnswer}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRevealAnswer();
              }
            }}
            className="mt-8 px-6 py-2.5 rounded-full border border-muted-foreground/30 text-muted-foreground hover:bg-muted/60 transition-colors text-sm"
            aria-label="显示答案"
          >
            显示答案
          </button>
        )}

        {/* Answer with fade-in */}
        <div
          className={`mt-8 w-full transition-all duration-300 ${
            answerRevealed
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none h-0 mt-0 overflow-hidden'
          }`}
        >
          <CardContent side="back" knowledge={knowledge} className="w-full" onSpeak={onSpeak} />
        </div>
      </div>
    </div>
  );
}
