import Link from "next/link";
import { NavigationAuthButtons } from "./NavigationAuthButtons";

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo on the left */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            聪明的背单词工具
          </Link>

          {/* Right side - Auth buttons (Client Component) */}
          <div className="flex items-center gap-2 md:gap-3">
            <NavigationAuthButtons />
          </div>
        </div>
      </div>
    </nav>
  );
}
