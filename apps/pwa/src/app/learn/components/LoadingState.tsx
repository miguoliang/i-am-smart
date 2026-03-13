export function LoadingState() {
  return (
    <div className="min-h-dvh w-full bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4 gap-6">
      {/* Card skeleton */}
      <div className="w-full max-w-2xl rounded-3xl bg-card shadow-2xl py-14 px-10 md:py-24 md:px-16 flex flex-col items-center gap-4 animate-pulse">
        <div className="h-12 w-48 rounded-lg bg-muted" />
        <div className="h-6 w-32 rounded-lg bg-muted" />
      </div>
      {/* Buttons skeleton */}
      <div className="w-full max-w-2xl flex gap-4 md:gap-6 animate-pulse">
        <div className="h-16 w-20 rounded-2xl bg-card shadow-xl" />
        <div className="flex-1 h-16 rounded-2xl bg-indigo-200 dark:bg-indigo-900/40 shadow-xl" />
      </div>
    </div>
  );
}
