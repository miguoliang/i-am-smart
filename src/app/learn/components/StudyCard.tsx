import type { Card } from "../types";
import { DynamicCard } from "./DynamicCard";
import { DEFAULT_CARD_TEMPLATES } from "@/lib/constants/templates";
import { cn } from "@/lib/utils";

interface StudyCardProps {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  onSpeak: (text: string, lang: "en-US" | "en-GB") => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export const StudyCard = ({
  card,
  flipped,
  onFlip,
  onTouchStart,
  onTouchEnd,
}: StudyCardProps) => {
  return (
    <div
      className="group w-full max-w-2xl [perspective:1000px]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onFlip}
    >
      <div
        className={cn(
          "relative grid transition-all duration-500 [transform-style:preserve-3d]",
          flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front Side */}
        <div className="col-start-1 row-start-1 h-full w-full [backface-visibility:hidden]">
          <CardFace>
            <DynamicCard 
              template={card.templates?.front || DEFAULT_CARD_TEMPLATES.front} 
              knowledge={card.knowledge} 
              className="h-full w-full"
            />
          </CardFace>
        </div>

        {/* Back Side */}
        <div className="col-start-1 row-start-1 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardFace>
            <DynamicCard 
              template={card.templates?.back || DEFAULT_CARD_TEMPLATES.back} 
              knowledge={card.knowledge}
              className="h-full w-full"
            />
          </CardFace>
        </div>
      </div>
    </div>
  );
};

function CardFace({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div 
      className={cn(
        "h-full min-h-96 w-full rounded-3xl bg-card p-12 shadow-2xl border flex flex-col justify-center items-center text-card-foreground", 
        className
      )}
    >
      {children}
    </div>
  );
}
