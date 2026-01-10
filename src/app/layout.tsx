// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { ConditionalFooter } from "./components/ConditionalFooter";
import { ConditionalNavigation } from "@/components/ConditionalNavigation";
import { Toaster } from "sonner";
import { PWAUpdater } from "./components/PWAUpdater";
import { SkipLink } from "@/components/SkipLink";

export const metadata: Metadata = {
  title: "背它一辈子",
  description: "一个基于间隔重复的英语学习应用",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Be It Forever",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <SkipLink />
        <Providers>
          <ConditionalNavigation />
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </Providers>
        <ConditionalFooter />
        <Toaster position="top-center" />
        <PWAUpdater />
      </body>
    </html>
  );
}
