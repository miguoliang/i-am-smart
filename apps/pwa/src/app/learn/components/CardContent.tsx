import { Knowledge } from '../types';

interface CardContentProps {
  knowledge: Knowledge;
  side: 'front' | 'back';
  className?: string;
  onSpeak?: (text: string, lang: "en-US" | "en-GB") => void;
}

export function CardContent({ knowledge, side, className, onSpeak }: CardContentProps) {
  if (side === 'front') {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-6 md:mb-10 text-center break-words max-w-full">
          {knowledge.name}
        </h2>
        <div className="flex gap-3">
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-full bg-muted/50"
            onClick={(e) => { e.stopPropagation(); onSpeak?.(knowledge.name, 'en-US'); }}
          >
            🇺🇸
          </button>
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition px-3 py-1.5 rounded-full bg-muted/50"
            onClick={(e) => { e.stopPropagation(); onSpeak?.(knowledge.name, 'en-GB'); }}
          >
            🇬🇧
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
      <p className="text-2xl md:text-5xl lg:text-7xl font-bold text-primary text-center break-words max-w-full px-2">
        {knowledge.description}
      </p>
    </div>
  );
}
