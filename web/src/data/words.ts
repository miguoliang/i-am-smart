export interface WordDef {
  id: string
  english: string
  chinese: string
  image: string
}

/** Food pack — first playable theme using existing KET sticker art. */
export const FOOD_WORDS: WordDef[] = [
  { id: 'apple', english: 'apple', chinese: '苹果', image: 'cards/apple.png' },
  { id: 'banana', english: 'banana', chinese: '香蕉', image: 'cards/banana.png' },
  { id: 'cake', english: 'cake', chinese: '蛋糕', image: 'cards/cake.png' },
  { id: 'egg', english: 'egg', chinese: '鸡蛋', image: 'cards/egg.png' },
  { id: 'milk', english: 'milk', chinese: '牛奶', image: 'cards/milk.png' },
  { id: 'juice', english: 'juice', chinese: '果汁', image: 'cards/juice.png' },
  { id: 'bread', english: 'bread', chinese: '面包', image: 'cards/bread.png' },
  { id: 'cheese', english: 'cheese', chinese: '奶酪', image: 'cards/cheese.png' },
]

export function wordById(id: string): WordDef | undefined {
  return FOOD_WORDS.find((w) => w.id === id)
}

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}

/** Warm the food card images so first paints rarely race cold network loads. */
export function preloadWordImages(): Promise<void> {
  return Promise.all(
    FOOD_WORDS.map(
      (word) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = assetUrl(word.image)
        }),
    ),
  ).then(() => undefined)
}
