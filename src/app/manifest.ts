import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Be It Forever - English Learning',
    short_name: 'Be It Forever',
    description: 'Master English with Spaced Repetition',
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
