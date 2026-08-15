import type { LessonPack } from './types'

function w(
  id: string,
  english: string,
  chinese: string,
  article: 'a' | 'an' = 'a',
): LessonPack['words'][number] {
  return {
    id,
    english,
    chinese,
    article,
    image: `cards/${id}.png`,
  }
}

/** Demo content only — replaceable by any peilian-pack/v1 document. */
export const BUILTIN_PACKS: LessonPack[] = [
  {
    id: 'food',
    titleZh: '食物饮品',
    titleEn: 'Food & Drink',
    blurb: '示例词包 · 可换成你家教材',
    source: 'builtin',
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
    blurb: '示例词包 · 可换成你家教材',
    source: 'builtin',
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
    blurb: '示例词包 · 可换成你家教材',
    source: 'builtin',
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
