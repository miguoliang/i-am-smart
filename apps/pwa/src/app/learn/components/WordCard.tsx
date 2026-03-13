import { Knowledge } from '../types';
import { CardContent } from './CardContent';

interface WordCardProps {
  knowledge: Knowledge;
  answerRevealed: boolean;
}

export function WordCard({ knowledge, answerRevealed }: WordCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-3xl shadow-2xl bg-card py-14 px-10 md:py-24 md:px-16 flex flex-col items-center justify-center">
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
