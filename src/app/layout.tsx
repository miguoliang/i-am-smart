// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from './providers'
import { ConditionalFooter } from './components/ConditionalFooter'
import { Toaster } from 'sonner'
import { PWAUpdater } from './components/PWAUpdater'

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: '背它一辈子',
  description: '一个基于间隔重复的英语学习应用',
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Be It Forever",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        <ConditionalFooter />
        <Toaster position="top-center" />
        <PWAUpdater />
      </body>
    </html>
  )
}
