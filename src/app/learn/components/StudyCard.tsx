import type { Card } from "../types";
import { DynamicCard } from "./DynamicCard";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";
import { DEFAULT_CARD_TEMPLATES } from "@/lib/constants/templates";

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
      className="group w-full max-w-2xl perspective-1000"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onFlip}
    >
      <div
        className="relative grid transition-all duration-500 preserve-3d"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front Side */}
        <div 
          className="col-start-1 row-start-1 backface-hidden"
          // When flipped (180deg), front face (0deg) is facing away.
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <ShadcnCard className="h-full min-h-96 rounded-3xl shadow-2xl p-0 flex flex-col justify-center items-center bg-card overflow-hidden">
            <CardContent className="h-full p-12 w-full">
              <DynamicCard 
                template={card.templates?.front || DEFAULT_CARD_TEMPLATES.front} 
                knowledge={card.knowledge} 
                className="h-full"
              />
            </CardContent>
          </ShadcnCard>
        </div>

        {/* Back Side */}
        <div 
          className="col-start-1 row-start-1 backface-hidden"
          style={{ 
            transform: "rotateY(180deg)", 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <ShadcnCard className="h-full min-h-96 rounded-3xl shadow-2xl p-0 flex flex-col justify-center items-center bg-card overflow-hidden">
            <CardContent className="h-full p-12 w-full">
              <DynamicCard 
                template={card.templates?.back || DEFAULT_CARD_TEMPLATES.back} 
                knowledge={card.knowledge}
                className="h-full"
              />
            </CardContent>
          </ShadcnCard>
        </div>
      </div>
    </div>
  );
};

