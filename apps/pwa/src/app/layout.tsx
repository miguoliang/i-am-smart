// src/app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
// ConditionalFooter removed — single-page minimal UI
import { ConditionalNavigation } from "@/components/navigation/ConditionalNavigation";
import { Toaster } from "sonner";
import { PWAUpdater } from "./components/PWAUpdater";
import { SkipLink } from "@/components/navigation/SkipLink";

const BAIDU_ANALYTICS_ID = process.env.NEXT_PUBLIC_BAIDU_ANALYTICS_ID;
const BAIDU_SITE_VERIFICATION = process.env.NEXT_PUBLIC_BAIDU_SITE_VERIFICATION;

export const metadata: Metadata = {
  title: "聪明的背单词工具",
  description: "一个基于间隔重复的英语学习应用",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "聪明的背单词工具",
  },
  ...(BAIDU_SITE_VERIFICATION && {
    other: {
      "baidu-site-verification": BAIDU_SITE_VERIFICATION,
    },
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      {BAIDU_ANALYTICS_ID && (
        <Script id="baidu-tongji" strategy="beforeInteractive">
          {`
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?" + "${BAIDU_ANALYTICS_ID}";
              var s = document.getElementsByTagName("script")[0];
              s.parentNode.insertBefore(hm, s);
            })();
          `}
        </Script>
      )}
      <body>
        <SkipLink />
        <Providers>
          <ConditionalNavigation />
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </Providers>
        <Toaster position="top-center" />
        <PWAUpdater />
      </body>
    </html>
  );
}
