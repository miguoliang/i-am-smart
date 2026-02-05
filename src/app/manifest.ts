import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '聪明的背单词工具',
    short_name: '背单词',
    description: '基于间隔重复的聪明背单词工具',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    icons: [
      {
        src: '/pwa-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
