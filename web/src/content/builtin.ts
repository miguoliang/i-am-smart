import {
  guessArticle,
  type LessonPack,
  type WordDef,
  type WordPos,
} from './types'

function word(
  id: string,
  english: string,
  chinese: string,
  opts: {
    article?: 'a' | 'an'
    pos?: WordPos
    image?: string
  } = {},
): WordDef {
  const pos = opts.pos ?? 'noun'
  return {
    id,
    english,
    chinese,
    pos,
    article: opts.article ?? guessArticle(english),
    image: opts.image ?? (pos === 'noun' ? `cards/${id}.png` : ''),
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
      word('apple', 'apple', '苹果', { article: 'an' }),
      word('banana', 'banana', '香蕉'),
      word('cake', 'cake', '蛋糕'),
      word('egg', 'egg', '鸡蛋', { article: 'an' }),
      word('milk', 'milk', '牛奶'),
      word('juice', 'juice', '果汁'),
      word('bread', 'bread', '面包'),
      word('cheese', 'cheese', '奶酪'),
    ],
  },
  {
    id: 'animals',
    titleZh: '动物',
    titleEn: 'Animals',
    blurb: '示例词包 · 可换成你家教材',
    source: 'builtin',
    words: [
      word('cat', 'cat', '猫'),
      word('dog', 'dog', '狗'),
      word('bird', 'bird', '鸟'),
      word('fish', 'fish', '鱼'),
      word('bear', 'bear', '熊'),
      word('horse', 'horse', '马'),
      word('pig', 'pig', '猪'),
      word('chicken', 'chicken', '鸡'),
    ],
  },
  {
    id: 'things',
    titleZh: '日常事物',
    titleEn: 'Things Around Us',
    blurb: '示例词包 · 可换成你家教材',
    source: 'builtin',
    words: [
      word('ball', 'ball', '球'),
      word('book', 'book', '书'),
      word('bag', 'bag', '包'),
      word('bus', 'bus', '公交车'),
      word('bicycle', 'bicycle', '自行车'),
      word('car', 'car', '小汽车'),
      word('house', 'house', '房子'),
      word('tree', 'tree', '树'),
    ],
  },
  {
    id: 'actions',
    titleZh: '动作动词',
    titleEn: 'Actions',
    blurb: '无配图示例 · 文字卡 + 动作句型',
    source: 'builtin',
    words: [
      word('run', 'run', '跑', { pos: 'verb' }),
      word('jump', 'jump', '跳', { pos: 'verb' }),
      word('eat', 'eat', '吃', { pos: 'verb' }),
      word('drink', 'drink', '喝', { pos: 'verb' }),
      word('sleep', 'sleep', '睡觉', { pos: 'verb' }),
      word('swim', 'swim', '游泳', { pos: 'verb' }),
      word('read', 'read', '读', { pos: 'verb' }),
      word('write', 'write', '写', { pos: 'verb' }),
    ],
  },
  {
    id: 'describe',
    titleZh: '描述形容词',
    titleEn: 'Describe',
    blurb: '无配图示例 · 文字卡 + It is / I am',
    source: 'builtin',
    words: [
      word('hot', 'hot', '热的', { pos: 'adjective' }),
      word('cold', 'cold', '冷的', { pos: 'adjective' }),
      word('big', 'big', '大的', { pos: 'adjective' }),
      word('small', 'small', '小的', { pos: 'adjective' }),
      word('happy', 'happy', '快乐的', { pos: 'adjective' }),
      word('sad', 'sad', '伤心的', { pos: 'adjective' }),
      word('hungry', 'hungry', '饿的', { pos: 'adjective' }),
      word('tired', 'tired', '累的', { pos: 'adjective' }),
    ],
  },
]
