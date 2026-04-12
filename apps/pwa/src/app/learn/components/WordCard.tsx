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

      {answerRevealed && (
        <div className="w-full min-w-0 mt-8">
          <div className="border-t border-muted-foreground/15 pt-6">
            <CardContent side="back" knowledge={knowledge} className="min-w-0 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
