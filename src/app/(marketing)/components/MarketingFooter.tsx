import Link from "next/link";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Bottom Left */}
          <div className="text-sm text-muted-foreground">
            <span>© {currentYear} 背它一辈子</span>
          </div>

          {/* Bottom Right - All links in one line */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              功能特性
            </Link>
            <Link
              href="/#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              定价
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              服务条款
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              隐私政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
