interface ProgressIndicatorProps {
  reviewed: number;
  total: number;
}

export function ProgressIndicator({ reviewed, total }: ProgressIndicatorProps) {
  const progress = total > 0 ? Math.min(reviewed / total, 1) : 0;

  return (
    <div className="w-full max-w-md mb-6">
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
