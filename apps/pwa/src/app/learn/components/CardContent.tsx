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
      <div className={`flex flex-col items-center justify-center min-w-0 w-full ${className || ''}`}>
        {/* 宽度随卡片限制，长词/括号说明等自动换行；break-words 处理无空格超长串 */}
        <h2 className="w-full max-w-full py-2 text-4xl md:text-6xl lg:text-8xl font-bold text-center text-balance break-words px-1 leading-[1.2] md:leading-[1.18] lg:leading-[1.15]">
          {knowledge.name}
        </h2>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center min-w-0 ${className || ''}`}>
      <p className="text-2xl md:text-5xl lg:text-7xl font-bold text-primary text-center break-words max-w-full px-2">
        {knowledge.description}
      </p>
    </div>
  );
}
