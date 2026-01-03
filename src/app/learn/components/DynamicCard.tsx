import React from 'react';
import { Knowledge } from '../types';
import { Button } from "@/components/ui/button";

interface DynamicCardProps {
  knowledge: Knowledge;
  side: 'front' | 'back';
  className?: string;
  onSpeak?: (text: string, lang: "en-US" | "en-GB") => void;
}

export function DynamicCard({ knowledge, side, className, onSpeak }: DynamicCardProps) {
  if (side === 'front') {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-4 md:mb-8 text-center break-words max-w-full">
          {knowledge.name}
        </h2>
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-6 md:mb-8">
          <Button
            variant="secondary"
            className="px-4 py-2 md:px-6 hover:scale-110 transition text-sm md:text-base"
            onClick={(e) => {
              e.stopPropagation();
              onSpeak?.(knowledge.name, 'en-US');
            }}
          >
            US Speaker
          </Button>
          <Button
            variant="secondary"
            className="px-4 py-2 md:px-6 hover:scale-110 transition text-sm md:text-base"
            onClick={(e) => {
              e.stopPropagation();
              onSpeak?.(knowledge.name, 'en-GB');
            }}
          >
            UK Speaker
          </Button>
        </div>
        <p className="text-sm md:text-xl text-muted-foreground text-center">点击、滑动或按 Enter/空格键查看答案</p>
      </div>
    );
  }

  // Back side
  return (
    <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
      <div className="flex items-center gap-6 mb-4 md:mb-8 px-2">
        <p className="text-2xl md:text-5xl lg:text-7xl font-bold text-primary text-center break-words max-w-full">
          {knowledge.description}
        </p>
      </div>
    </div>
  );
};
