export interface WordDef {
  id: string
  english: string
  chinese: string
  image: string
  /** Indefinite article for sentence frames */
  article: 'a' | 'an'
}

export interface LessonPack {
  id: string
  titleZh: string
  titleEn: string
  blurb: string
  words: WordDef[]
}

function w(
  id: string,
  english: string,
  chinese: string,
  article: 'a' | 'an' = 'a',
): WordDef {
  return {
    id,
    english,
    chinese,
    article,
    image: `cards/${id}.png`,
  }
}

export const PACKS: LessonPack[] = [
  {
    id: 'food',
    titleZh: '食物饮品',
    titleEn: 'Food & Drink',
    blurb: '看图认词，再练固定问句',
    words: [
      w('apple', 'apple', '苹果', 'an'),
      w('banana', 'banana', '香蕉'),
      w('cake', 'cake', '蛋糕'),
      w('egg', 'egg', '鸡蛋', 'an'),
      w('milk', 'milk', '牛奶'),
      w('juice', 'juice', '果汁'),
      w('bread', 'bread', '面包'),
      w('cheese', 'cheese', '奶酪'),
    ],
  },
  {
    id: 'animals',
    titleZh: '动物',
    titleEn: 'Animals',
    blurb: '指图说出名字，再替换句型',
    words: [
      w('cat', 'cat', '猫'),
      w('dog', 'dog', '狗'),
      w('bird', 'bird', '鸟'),
      w('fish', 'fish', '鱼'),
      w('bear', 'bear', '熊'),
      w('horse', 'horse', '马'),
      w('pig', 'pig', '猪'),
      w('chicken', 'chicken', '鸡'),
    ],
  },
  {
    id: 'things',
    titleZh: '日常事物',
    titleEn: 'Things Around Us',
    blurb: '身边物品的看图说话',
    words: [
      w('ball', 'ball', '球'),
      w('book', 'book', '书'),
      w('bag', 'bag', '包'),
      w('bus', 'bus', '公交车'),
      w('bicycle', 'bicycle', '自行车'),
      w('car', 'car', '小汽车'),
      w('house', 'house', '房子'),
      w('tree', 'tree', '树'),
    ],
  },
]

export function packById(id: string): LessonPack | undefined {
  return PACKS.find((p) => p.id === id)
}

export function wordById(pack: LessonPack, id: string): WordDef | undefined {
  return pack.words.find((w) => w.id === id)
}

export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL
  return `${base}${path.replace(/^\//, '')}`
}

export function withArticle(word: WordDef): string {
  return `${word.article} ${word.english}`
}

export function preloadPackImages(pack: LessonPack): Promise<void> {
  return Promise.all(
    pack.words.map(
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
