import type { WordDef } from '../content/types'
import {
  hasImage,
  presentParticiple,
  withArticle,
} from '../content/types'

/** Fixed talk slots — questions stay; only the word (and optional image) changes. */
export type QuestionKind = 'name' | 'describe' | 'prefer' | 'frame'

export interface QuestionTemplate {
  id: string
  kind: QuestionKind
  /** Short label for the progress chip */
  labelZh: string
  /** What the parent should do (Chinese) */
  parentCueZh: (word: WordDef) => string
  /** Exact English line the parent asks / models */
  askEn: (word: WordDef) => string
  /** Suggested child answers the parent can reveal */
  expectEn: (word: WordDef) => string[]
  /** Optional Chinese tip for the parent */
  tipZh?: string | ((word: WordDef) => string)
}

function pointCue(word: WordDef): string {
  return hasImage(word)
    ? '指着图片，用英文问孩子：'
    : '看着这个词，用英文问孩子：'
}

export const QUESTION_BANK: QuestionTemplate[] = [
  {
    id: 'what-is-this',
    kind: 'name',
    labelZh: '命名',
    parentCueZh: pointCue,
    askEn: () => 'What is this?',
    expectEn: (word) => [word.english, `It's ${withArticle(word)}.`, withArticle(word)],
    tipZh: '孩子只说出单词也算对；完整句更好。',
  },
  {
    id: 'what-do-you-see',
    kind: 'name',
    labelZh: '看见',
    parentCueZh: () => '再换一种问法：',
    askEn: () => 'What do you see?',
    expectEn: (word) => [`I see ${withArticle(word)}.`, word.english],
  },
  {
    id: 'is-this-a',
    kind: 'name',
    labelZh: '确认',
    parentCueZh: (word) =>
      hasImage(word) ? '用是非问巩固发音：' : '看着单词用是非问巩固发音：',
    askEn: (word) => `Is this ${withArticle(word)}?`,
    expectEn: () => ['Yes.', 'Yes, it is.'],
    tipZh: '先练肯定回答。',
  },
  {
    id: 'say-the-word',
    kind: 'name',
    labelZh: '跟读',
    parentCueZh: () => '示范后让孩子跟读：',
    askEn: (word) => `Say "${word.english}".`,
    expectEn: (word) => [word.english],
    tipZh: '可点喇叭先听标准发音，再让孩子说。',
  },
  {
    id: 'colour',
    kind: 'describe',
    labelZh: '颜色',
    parentCueZh: () => '问颜色（图上看到什么说什么）：',
    askEn: () => 'What colour is it?',
    expectEn: () => ['It is …', "It's …"],
    tipZh: '答案看图即可；鼓励说完整句 It is + colour。',
  },
  {
    id: 'big-or-small',
    kind: 'describe',
    labelZh: '大小',
    parentCueZh: () => '二选一，降低开口难度：',
    askEn: () => 'Is it big or small?',
    expectEn: () => ['Big.', 'Small.', "It's big.", "It's small."],
  },
  {
    id: 'do-you-like',
    kind: 'prefer',
    labelZh: '喜好',
    parentCueZh: () => '问喜好，鼓励真实回答：',
    askEn: (word) => `Do you like ${word.english}?`,
    expectEn: (word) => [
      `Yes, I like ${word.english}.`,
      `No, I don't like ${word.english}.`,
      'Yes.',
      'No.',
    ],
  },
  {
    id: 'frame-this-is',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '让孩子用固定句型说：',
    askEn: (word) => `Say: "This is ${withArticle(word)}."`,
    expectEn: (word) => [`This is ${withArticle(word)}.`],
  },
  {
    id: 'frame-i-see',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '换一个句型槽：',
    askEn: (word) => `Say: "I see ${withArticle(word)}."`,
    expectEn: (word) => [`I see ${withArticle(word)}.`],
  },
  {
    id: 'frame-i-like',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '把词放进喜好句：',
    askEn: (word) => `Say: "I like ${word.english}."`,
    expectEn: (word) => [`I like ${word.english}.`],
  },
  {
    id: 'what-doing',
    kind: 'name',
    labelZh: '动作',
    parentCueZh: (word) =>
      hasImage(word)
        ? '指着图里的动作，用英文问孩子：'
        : '做这个动作或看着单词，用英文问孩子：',
    askEn: () => 'What is he doing?',
    expectEn: (word) => [
      presentParticiple(word.english),
      `He is ${presentParticiple(word.english)}.`,
      word.english,
    ],
    tipZh: '孩子说出动词原形或 -ing 都算对。',
  },
  {
    id: 'can-you',
    kind: 'prefer',
    labelZh: '能力',
    parentCueZh: () => '问孩子会不会做：',
    askEn: (word) => `Can you ${word.english}?`,
    expectEn: (word) => [
      `Yes, I can ${word.english}.`,
      'Yes, I can.',
      `No, I can't ${word.english}.`,
      "No, I can't.",
    ],
  },
  {
    id: 'like-to',
    kind: 'prefer',
    labelZh: '喜好',
    parentCueZh: () => '问喜好，鼓励真实回答：',
    askEn: (word) => `Do you like to ${word.english}?`,
    expectEn: (word) => [
      `Yes, I like to ${word.english}.`,
      `No, I don't like to ${word.english}.`,
      'Yes.',
      'No.',
    ],
  },
  {
    id: 'frame-he-is',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '让孩子用进行时说：',
    askEn: (word) => `Say: "He is ${presentParticiple(word.english)}."`,
    expectEn: (word) => [`He is ${presentParticiple(word.english)}.`],
  },
  {
    id: 'frame-i-can',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '换一个句型槽：',
    askEn: (word) => `Say: "I can ${word.english}."`,
    expectEn: (word) => [`I can ${word.english}.`],
  },
  {
    id: 'how-is-it',
    kind: 'name',
    labelZh: '描述',
    parentCueZh: (word) =>
      hasImage(word)
        ? '指着图，问它怎么样：'
        : '看着这个词，问它怎么样：',
    askEn: () => 'How is it?',
    expectEn: (word) => [word.english, `It is ${word.english}.`, `It's ${word.english}.`],
    tipZh: '孩子只说出单词也算对。',
  },
  {
    id: 'is-it',
    kind: 'name',
    labelZh: '确认',
    parentCueZh: () => '用是非问巩固发音：',
    askEn: (word) => `Is it ${word.english}?`,
    expectEn: () => ['Yes.', 'Yes, it is.'],
  },
  {
    id: 'frame-it-is',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '让孩子用固定句型说：',
    askEn: (word) => `Say: "It is ${word.english}."`,
    expectEn: (word) => [`It is ${word.english}.`],
  },
  {
    id: 'frame-i-am',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: () => '换成 I am …（心情、冷热也适用）：',
    askEn: (word) => `Say: "I am ${word.english}."`,
    expectEn: (word) => [`I am ${word.english}.`],
  },
]

const NOUN_SEQUENCE = [
  'what-is-this',
  'say-the-word',
  'what-do-you-see',
  'colour',
  'do-you-like',
  'frame-this-is',
  'frame-i-see',
]

const VERB_SEQUENCE = [
  'what-doing',
  'say-the-word',
  'can-you',
  'like-to',
  'frame-he-is',
  'frame-i-can',
]

const ADJECTIVE_SEQUENCE = [
  'how-is-it',
  'say-the-word',
  'is-it',
  'frame-it-is',
  'frame-i-am',
]

const BANK = new Map(QUESTION_BANK.map((q) => [q.id, q]))

function pick(ids: string[]): QuestionTemplate[] {
  return ids
    .map((id) => BANK.get(id))
    .filter((q): q is QuestionTemplate => Boolean(q))
}

/** Talk questions for one word — nouns keep the picture set; verbs/adjectives use action/describe frames. */
export function questionsForWord(word: WordDef): QuestionTemplate[] {
  if (word.pos === 'verb') return pick(VERB_SEQUENCE)
  if (word.pos === 'adjective') return pick(ADJECTIVE_SEQUENCE)
  const seq = hasImage(word)
    ? NOUN_SEQUENCE
    : NOUN_SEQUENCE.filter((id) => id !== 'colour')
  return pick(seq)
}

export function cueText(question: QuestionTemplate, word: WordDef): string {
  return question.parentCueZh(word)
}

export function tipText(
  question: QuestionTemplate,
  word: WordDef,
): string | undefined {
  const tip = question.tipZh
  if (!tip) return undefined
  return typeof tip === 'function' ? tip(word) : tip
}

export function reviewFrames(word: WordDef): string[] {
  if (word.pos === 'verb') {
    return [
      `He is ${presentParticiple(word.english)}.`,
      `I can ${word.english}.`,
    ]
  }
  if (word.pos === 'adjective') {
    return [`It is ${word.english}.`, `I am ${word.english}.`]
  }
  return [`This is ${withArticle(word)}.`, `I like ${word.english}.`]
}

export function reviewCueHidden(word: WordDef): string {
  if (word.pos === 'verb') {
    return hasImage(word)
      ? '遮住英文：问孩子 “What is he doing?”，等他说完再点下方按钮。'
      : '遮住英文：问孩子这个动作怎么说，等他说完再点下方按钮。'
  }
  if (word.pos === 'adjective') {
    return '遮住英文：问孩子 “How is it?” / 这个词怎么说，等他说完再点下方按钮。'
  }
  return hasImage(word)
    ? '遮住英文：问孩子 “What is this?”，等他说完再点下方按钮。'
    : '遮住英文：问孩子这个词怎么说，等他说完再点下方按钮。'
}

export function reviewCueRevealed(word: WordDef): string {
  if (word.pos === 'verb') {
    return '对照发音，再让孩子用完整句说一遍：He is …ing / I can …'
  }
  if (word.pos === 'adjective') {
    return '对照发音，再让孩子用完整句说一遍：It is … / I am …'
  }
  return '对照发音，再让孩子用完整句说一遍：This is … / I like …'
}

export function vocabCue(word: WordDef): string {
  if (hasImage(word)) {
    return '家长：指着图，让孩子先听再跟读英文；可以说中文意思帮助理解。'
  }
  return '家长：看着单词，让孩子先听再跟读英文；可以说中文意思帮助理解。动词可边做动作边说。'
}
