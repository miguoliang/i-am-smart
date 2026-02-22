import { Knowledge } from '../types';
import { CardContent } from './CardContent';

interface WordCardProps {
  knowledge: Knowledge;
  answerRevealed: boolean;
  onSpeak?: (text: string, lang: "en-US" | "en-GB") => void;
}

export function WordCard({ knowledge, answerRevealed, onSpeak }: WordCardProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-3xl shadow-2xl bg-card py-10 px-8 md:py-16 md:px-12 flex flex-col items-center justify-center">
        {/* Word + pronunciation (always visible) */}
        <CardContent side="front" knowledge={knowledge} className="w-full" onSpeak={onSpeak} />

        {/* Answer with fade-in */}
        <div
          className={`w-full transition-all duration-300 ${
            answerRevealed
              ? 'opacity-100 translate-y-0 mt-8'
              : 'opacity-0 translate-y-2 pointer-events-none h-0 mt-0 overflow-hidden'
          }`}
        >
          <div className="border-t border-muted-foreground/15 pt-6">
            <CardContent side="back" knowledge={knowledge} className="w-full" onSpeak={onSpeak} />
          </div>
        </div>
      </div>
    </div>
  );
}
