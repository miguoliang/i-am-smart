"use client";

import { useState } from "react";
import { FlipCard } from "@/components/container/FlipCard";
import { CardContent } from "@/app/learn/components/CardContent";
import { ProgressIndicator } from "@/app/learn/components/ProgressIndicator";
import { RatingButtons } from "@/app/learn/components/RatingButtons";
import type { Card } from "@/app/learn/types";
import { logger } from "@/lib/utils/logger";

// Screen layout constants
const MIN_SCREEN_HEIGHT = 400; // Minimum height for the mock learn screen
const MAX_CARD_HEIGHT_MOBILE = 300; // Maximum card height on mobile devices

// Mock cards for demonstration
const MOCK_CARDS: Card[] = [
  {
    id: 1,
    knowledge_code: "word_1",
    knowledge: {
      code: "word_1",
      name: "Hello",
      description: "你好",
      metadata: {},
    },
    next_review_date: new Date().toISOString(),
  },
  {
    id: 2,
    knowledge_code: "word_2",
    knowledge: {
      code: "word_2",
      name: "World",
      description: "世界",
      metadata: {},
    },
    next_review_date: new Date().toISOString(),
  },
  {
    id: 3,
    knowledge_code: "word_3",
    knowledge: {
      code: "word_3",
      name: "Learn",
      description: "学习",
      metadata: {},
    },
    next_review_date: new Date().toISOString(),
  },
];

export function MockLearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  const currentCard = MOCK_CARDS[currentIndex];
  const total = MOCK_CARDS.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = () => {
    // Move to next card
    if (currentIndex < MOCK_CARDS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setReviewedCount(reviewedCount + 1);
      setIsFlipped(false);
    } else {
      // Loop back to first card
      setCurrentIndex(0);
      setReviewedCount(0);
      setIsFlipped(false);
    }
  };

  const handleSpeak = () => {
    // Mock speech - in real app this would use the speech API
    // No-op for mock screen
  };

  if (!currentCard) {
    logger.error("Current card is undefined", {
      currentIndex,
      total: MOCK_CARDS.length,
      context: "MockLearnScreen",
    });
    return null;
  }

  // No-op touch handlers - FlipCard requires these props but we don't need touch handling
  // in the mock screen since it's displayed in frames that handle touch events separately
  const handleTouchStart = () => {
    // Intentionally empty - touch handling not needed in mock screen context
  };

  const handleTouchEnd = () => {
    // Intentionally empty - touch handling not needed in mock screen context
  };

  return (
    <div 
      className="h-full w-full bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden"
      style={{ minHeight: `${MIN_SCREEN_HEIGHT}px` }}
    >
      <div className="w-full shrink-0 mb-2 md:mb-4 flex justify-center">
        <ProgressIndicator reviewed={reviewedCount} total={total} />
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-2xl min-h-0 px-2">
        {/* Mobile uses MAX_CARD_HEIGHT_MOBILE (300px), desktop responsive handled by Tailwind md: breakpoint (400px) */}
        <div 
          className="w-full h-full max-h-[300px] md:max-h-[400px]"
          style={{
            maxHeight: `${MAX_CARD_HEIGHT_MOBILE}px`,
          }}
        >
          <FlipCard
            key={currentCard.id}
            front={
              <CardContent
                side="front"
                knowledge={currentCard.knowledge}
                className="h-full w-full"
                onSpeak={handleSpeak}
              />
            }
            back={
              <CardContent
                side="back"
                knowledge={currentCard.knowledge}
                className="h-full w-full"
                onSpeak={handleSpeak}
              />
            }
            flipped={isFlipped}
            onFlip={handleFlip}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>

      {isFlipped && (
        <div className="mt-2 md:mt-4 w-full max-w-2xl px-2 shrink-0">
          <RatingButtons onRate={handleRate} />
        </div>
      )}
    </div>
  );
}
