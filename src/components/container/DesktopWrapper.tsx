// src/components/DesktopWrapper.tsx   ← 新建这个文件！必须是 Client Component
'use client'

import { DesktopProps } from '@/components/container/Desktop'
import dynamic from 'next/dynamic'

// 这里放 ssr: false
const DesktopLazy = dynamic(
  () => import('@/components/container/Desktop').then(mod => mod.Desktop),
  { ssr: false }
)

export function DesktopWrapper(props: DesktopProps) {
  return <DesktopLazy {...props} />
}