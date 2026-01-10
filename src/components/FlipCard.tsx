import { useFlipCardInteractions } from "@/hooks/useFlipCardInteractions";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  flipped: boolean;
  onFlip: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * FlipCard component handles the flip animation and container structure.
 * It doesn't care what content it displays - accepts front and back as props.
 * Uses useFlipCardInteractions hook for interaction logic (SRP compliance).
 * Follows Dependency Inversion Principle: depends on ReactNode abstraction, not concrete content.
 */
export const FlipCard = ({
  front,
  back,
  flipped,
  onFlip,
  onTouchStart,
  onTouchEnd,
}: FlipCardProps) => {
  const { handleKeyDown, handleKeyUp, ariaLabel } = useFlipCardInteractions({
    flipped,
    onFlip,
  });

  return (
    <div
      className="group w-full max-w-2xl [perspective:1000px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-3xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onClick={onFlip}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "relative grid transition-all duration-500 [transform-style:preserve-3d]",
          flipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front Side */}
        <div className="col-start-1 row-start-1 h-full w-full [backface-visibility:hidden]">
          <CardFace>{front}</CardFace>
        </div>

        {/* Back Side */}
        <div className="col-start-1 row-start-1 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <CardFace>{back}</CardFace>
        </div>
      </div>
    </div>
  );
};

function CardFace({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-full min-h-[50vh] md:min-h-96 w-full rounded-3xl bg-card p-6 md:p-12 shadow-2xl border flex flex-col justify-center items-center text-card-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}
