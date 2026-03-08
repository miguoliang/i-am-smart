import { Knowledge } from '../types';

interface CardContentProps {
  knowledge: Knowledge;
  side: 'front' | 'back';
  className?: string;
  onSpeak?: (text: string, lang: "en-US" | "en-GB") => void;
}

export function CardContent({ knowledge, side, className }: CardContentProps) {
  if (side === 'front') {
    return (
      <div className={`flex flex-col items-center justify-center h-full ${className || ''}`}>
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold text-center break-words max-w-full">
          {knowledge.name}
        </h2>
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
