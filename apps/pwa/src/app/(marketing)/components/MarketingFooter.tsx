import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Bottom Left */}
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© {currentYear} 聪明的背单词工具</span>
            <Separator orientation="vertical" className="h-4" />
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              湘ICP备2026003808号
            </a>
            <Separator orientation="vertical" className="h-4" />
            <a
              href="https://beian.mps.gov.cn/#/query/webSearch?code=43010502001984"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              湘公网安备43010502001984号
            </a>
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
