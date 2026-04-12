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
            className={answerRevealed ? undefined : "select-none"}
            aria-hidden={!answerRevealed}
          >
            <CardContent side="back" knowledge={knowledge} className="min-w-0 w-full" />
          </div>
          {!answerRevealed && (
            <div
              data-testid="answer-mask"
              className="absolute inset-0 z-10 overflow-hidden rounded-2xl"
              aria-hidden
            >
              <div className="absolute inset-0 bg-card" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-muted/25 via-card/80 to-muted/30 px-5 py-6">
                <div className="pointer-events-none w-full max-w-[min(100%,16rem)] space-y-2.5 opacity-70">
                  <div className="mx-auto h-2.5 w-[92%] rounded-full bg-muted-foreground/22" />
                  <div className="mx-auto h-2.5 w-[72%] rounded-full bg-muted-foreground/18" />
                  <div className="mx-auto h-2.5 w-[84%] rounded-full bg-muted-foreground/15" />
                </div>
                <div className="relative flex flex-col items-center gap-1 rounded-xl border border-dashed border-muted-foreground/25 bg-card/60 px-4 py-2.5 text-center shadow-sm backdrop-blur-[2px]">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground">
                    释义
                  </span>
                  <span className="text-[11px] leading-snug text-muted-foreground/75 sm:text-xs">
                    选择下方评分后显示
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
