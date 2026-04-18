import { cn } from "@/lib/utils";
import { Knowledge } from '../types';
import { CardContent } from './CardContent';

interface WordCardProps {
  knowledge: Knowledge;
  answerRevealed: boolean;
}

export function WordCard({ knowledge, answerRevealed }: WordCardProps) {
  return (
    <div
      data-testid="word-card"
      className="w-full min-w-0 rounded-3xl shadow-2xl bg-card py-14 px-10 md:py-24 md:px-16 flex flex-col items-stretch justify-center"
    >
      <CardContent side="front" knowledge={knowledge} className="min-w-0 w-full" />

      <div className="w-full min-w-0 mt-8">
        <div className="relative border-t border-muted-foreground/15 pt-6">
          <div
            className={cn(!answerRevealed && "invisible")}
            aria-hidden={!answerRevealed}
          >
            <CardContent side="back" knowledge={knowledge} className="min-w-0 w-full" />
          </div>
          {!answerRevealed && (
            <div
              data-testid="answer-mask"
              className="absolute inset-0 z-10 flex flex-col justify-center py-1"
              aria-hidden
            >
              <div className="h-10 w-full max-w-full animate-pulse rounded-xl bg-muted" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
