import type { Viewport, Metadata } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eff6ff" }, // blue-50
    { media: "(prefers-color-scheme: dark)", color: "#111827" }, // gray-900
  ],
};

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
