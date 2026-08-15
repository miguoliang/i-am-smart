import type { LessonPack, WordDef } from './types'

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}

/** Resolve a word image for <img src>. */
export function wordImageSrc(word: WordDef): string {
  const src = word.image.trim()
  if (!src) return ''
  if (
    src.startsWith('data:') ||
    src.startsWith('blob:') ||
    /^https?:\/\//i.test(src)
  ) {
    return src
  }
  return assetUrl(src)
}

export function preloadPackImages(pack: LessonPack): Promise<void> {
  return Promise.all(
    pack.words.map(
      (word) =>
        new Promise<void>((resolve) => {
          const src = wordImageSrc(word)
          if (!src) {
            resolve()
            return
          }
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = src
        }),
    ),
  ).then(() => undefined)
}

/** Compress user uploads so packs stay small enough for browser storage. */
export async function fileToDataUrl(
  file: File,
  maxEdge = 512,
  quality = 0.72,
): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法处理图片')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}
