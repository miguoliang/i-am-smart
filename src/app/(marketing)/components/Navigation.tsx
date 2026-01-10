import Link from "next/link";

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="relative flex h-16 items-center justify-between">
          {/* Logo on the left */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white hover:opacity-80 transition-opacity z-10"
          >
            背它一辈子
          </Link>

          {/* Desktop menu - centered */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6 z-10">
            <Link
              href="/features"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              功能特性
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              定价
            </Link>
            <Link
              href="/changelog"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              更新日志
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              文档
            </Link>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              博客
            </Link>
          </div>

          {/* Right side - spacer to balance layout */}
          <div className="hidden md:block w-[120px]"></div>
        </div>
      </div>
    </nav>
  );
}
