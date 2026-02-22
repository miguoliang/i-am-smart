import { Knowledge } from '../types';
import { CardContent } from './CardContent';

interface WordCardProps {
  knowledge: Knowledge;
  answerRevealed: boolean;
}

export function WordCard({ knowledge, answerRevealed }: WordCardProps) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="rounded-3xl shadow-2xl bg-card py-10 px-8 md:py-16 md:px-12 flex flex-col items-center justify-center">
        <CardContent side="front" knowledge={knowledge} className="w-full" />

        {answerRevealed && (
          <div className="w-full mt-8">
            <div className="border-t border-muted-foreground/15 pt-6">
              <CardContent side="back" knowledge={knowledge} className="w-full" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
