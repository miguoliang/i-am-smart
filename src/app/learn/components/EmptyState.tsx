import { TopBar } from "./TopBar";
import { useSignOut } from "@/hooks/useSignOut";

export function EmptyState() {
  const { signOut, isSigningOut } = useSignOut();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <TopBar onSignOut={signOut} isSigningOut={isSigningOut} />
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          今日复习完成！
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
          明天再来哦
        </p>
      </div>
    </div>
  );
}

