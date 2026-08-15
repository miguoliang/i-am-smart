import type { WordDef } from './words'
import { withArticle } from './words'

/** Fixed picture-talk slots — questions stay; only the word/image changes. */
export type QuestionKind = 'name' | 'describe' | 'prefer' | 'frame'

export interface QuestionTemplate {
  id: string
  kind: QuestionKind
  /** Short label for the progress chip */
  labelZh: string
  /** What the parent should do (Chinese) */
  parentCueZh: string
  /** Exact English line the parent asks / models */
  askEn: (word: WordDef) => string
  /** Suggested child answers the parent can reveal */
  expectEn: (word: WordDef) => string[]
  /** Optional Chinese tip for the parent */
  tipZh?: string
}

export const QUESTION_BANK: QuestionTemplate[] = [
  {
    id: 'what-is-this',
    kind: 'name',
    labelZh: '命名',
    parentCueZh: '指着图片，用英文问孩子：',
    askEn: () => 'What is this?',
    expectEn: (word) => [word.english, `It's ${withArticle(word)}.`, withArticle(word)],
    tipZh: '孩子只说出单词也算对；完整句更好。',
  },
  {
    id: 'what-do-you-see',
    kind: 'name',
    labelZh: '看见',
    parentCueZh: '再换一种问法：',
    askEn: () => 'What do you see?',
    expectEn: (word) => [`I see ${withArticle(word)}.`, word.english],
  },
  {
    id: 'is-this-a',
    kind: 'name',
    labelZh: '确认',
    parentCueZh: '用是非问巩固发音：',
    askEn: (word) => `Is this ${withArticle(word)}?`,
    expectEn: () => ['Yes.', 'Yes, it is.'],
    tipZh: '故意指对图问，先练肯定回答。',
  },
  {
    id: 'say-the-word',
    kind: 'name',
    labelZh: '跟读',
    parentCueZh: '示范后让孩子跟读：',
    askEn: (word) => `Say "${word.english}".`,
    expectEn: (word) => [word.english],
    tipZh: '可点喇叭先听标准发音，再让孩子说。',
  },
  {
    id: 'colour',
    kind: 'describe',
    labelZh: '颜色',
    parentCueZh: '问颜色（图上看到什么说什么）：',
    askEn: () => 'What colour is it?',
    expectEn: () => ['It is …', "It's …"],
    tipZh: '答案看图即可；鼓励说完整句 It is + colour。',
  },
  {
    id: 'big-or-small',
    kind: 'describe',
    labelZh: '大小',
    parentCueZh: '二选一，降低开口难度：',
    askEn: () => 'Is it big or small?',
    expectEn: () => ['Big.', 'Small.', "It's big.", "It's small."],
  },
  {
    id: 'do-you-like',
    kind: 'prefer',
    labelZh: '喜好',
    parentCueZh: '问喜好，鼓励真实回答：',
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
    parentCueZh: '让孩子用固定句型说：',
    askEn: (word) => `Say: "This is ${withArticle(word)}."`,
    expectEn: (word) => [`This is ${withArticle(word)}.`],
  },
  {
    id: 'frame-i-see',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: '换一个句型槽：',
    askEn: (word) => `Say: "I see ${withArticle(word)}."`,
    expectEn: (word) => [`I see ${withArticle(word)}.`],
  },
  {
    id: 'frame-i-like',
    kind: 'frame',
    labelZh: '句型',
    parentCueZh: '把词放进喜好句：',
    askEn: (word) => `Say: "I like ${word.english}."`,
    expectEn: (word) => [`I like ${word.english}.`],
  },
]

/** Default order for one picture-talk pass over a single image. */
export const DEFAULT_TALK_SEQUENCE: string[] = [
  'what-is-this',
  'say-the-word',
  'what-do-you-see',
  'colour',
  'do-you-like',
  'frame-this-is',
  'frame-i-see',
]

export function questionsForTalk(): QuestionTemplate[] {
  const map = new Map(QUESTION_BANK.map((q) => [q.id, q]))
  return DEFAULT_TALK_SEQUENCE.map((id) => map.get(id)).filter(
    (q): q is QuestionTemplate => Boolean(q),
  )
}
