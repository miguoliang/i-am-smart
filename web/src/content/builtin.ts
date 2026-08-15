import {
  guessArticle,
  type LessonPack,
  type SentenceDef,
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

function sentence(
  id: string,
  english: string,
  chinese = '',
  opts: { answer?: string; answerZh?: string } = {},
): SentenceDef {
  return {
    id,
    english,
    chinese,
    answer: opts.answer ?? '',
    answerZh: opts.answerZh ?? '',
  }
}

/** One sample class — replaceable by any peilian-pack/v1 document. */
export const BUILTIN_PACKS: LessonPack[] = [
  {
    id: 'sample-class',
    titleZh: '示例·一节外教课',
    titleEn: 'Sample class',
    blurb: '家长旁听记下的词汇和问答 · 一课一份',
    source: 'builtin',
    words: [
      word('apple', 'apple', '苹果', { article: 'an' }),
      word('water', 'water', '水'),
      word('run', 'run', '跑', { pos: 'verb' }),
      word('happy', 'happy', '开心的', { pos: 'adjective' }),
    ],
    sentences: [
      sentence('hello-how-are-you', 'Hello, how are you?', '你好吗？', {
        answer: "I'm fine, thank you.",
        answerZh: '我很好，谢谢。',
      }),
      sentence('i-like-apples', 'I like apples.', '我喜欢苹果。'),
      sentence(
        'can-i-have-water',
        'Can I have some water, please?',
        '我能喝点水吗？',
        {
          answer: 'Yes, here you are.',
          answerZh: '好的，给你。',
        },
      ),
      sentence('he-is-running', 'He is running.', '他在跑。'),
      sentence('i-am-happy', 'I am happy today.', '我今天很开心。'),
    ],
  },
]
