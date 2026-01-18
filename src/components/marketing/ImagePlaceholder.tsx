import { type LucideIcon } from "lucide-react";
import { BookOpen, Smile, Train, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePlaceholderProps {
  alt: string;
  className?: string;
  variant?: "pain" | "joy" | "commute" | "bedtime";
}

const variantConfig: Record<
  "pain" | "joy" | "commute" | "bedtime",
  {
    icon: LucideIcon;
    gradient: string;
    iconColor: string;
  }
> = {
  pain: {
    icon: BookOpen,
    gradient: "bg-linear-to-br from-gray-200 via-gray-300 to-gray-400",
    iconColor: "text-gray-500",
  },
  joy: {
    icon: Smile,
    gradient: "bg-linear-to-br from-amber-200 via-amber-300 to-amber-400",
    iconColor: "text-amber-600",
  },
  commute: {
    icon: Train,
    gradient: "bg-linear-to-br from-blue-200 via-blue-300 to-blue-400",
    iconColor: "text-blue-600",
  },
  bedtime: {
    icon: Moon,
    gradient: "bg-linear-to-br from-indigo-200 via-indigo-300 to-indigo-400",
    iconColor: "text-indigo-600",
  },
};

export function ImagePlaceholder({
  alt,
  className,
  variant = "joy",
}: ImagePlaceholderProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        config.gradient,
        className
      )}
      role="img"
      aria-label={alt}
    >
      <Icon className={cn("w-1/3 h-1/3 opacity-60", config.iconColor)} />
    </div>
  );
}
