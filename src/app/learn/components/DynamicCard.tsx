import React from 'react';
import { Knowledge } from '../types';
import { Button } from "@/components/ui/button";

interface DynamicCardProps {
  knowledge: Knowledge;
  side: 'front' | 'back';
  className?: string;
  onSpeak?: (text: string, lang: "en-US" | "en-GB") => void;
}

export const DynamicCard: React.FC<DynamicCardProps> = ({ knowledge, side, className, onSpeak }) => {
  if (side === 'front') {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
        <h2 className="text-8xl font-bold mb-8">{knowledge.name}</h2>
        <div className="flex gap-4 mb-8">
          <Button
            variant="secondary"
            className="px-6 py-2 hover:scale-110 transition"
            onClick={(e) => {
              e.stopPropagation();
              onSpeak?.(knowledge.name, 'en-US');
            }}
          >
            US Speaker
          </Button>
          <Button
            variant="secondary"
            className="px-6 py-2 hover:scale-110 transition"
            onClick={(e) => {
              e.stopPropagation();
              onSpeak?.(knowledge.name, 'en-GB');
            }}
          >
            UK Speaker
          </Button>
        </div>
        <p className="text-2xl text-muted-foreground">Click or swipe to see answer</p>
      </div>
    );
  }

  // Back side
  return (
    <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
      <div className="flex items-center gap-6 mb-8">
        <p className="text-7xl font-bold text-primary text-center">{knowledge.description}</p>
      </div>
    </div>
  );
};
