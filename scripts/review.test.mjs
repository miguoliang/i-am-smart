import assert from 'node:assert/strict'
import test from 'node:test'
import {
  defaultReviewCount,
  reviewCountChoices,
  sliceReviewPack,
  takeRandom,
} from '../web/src/content/practice.ts'

test('review count defaults to 10 or all if fewer', () => {
  assert.equal(defaultReviewCount(0), 0)
  assert.equal(defaultReviewCount(4), 4)
  assert.equal(defaultReviewCount(10), 10)
  assert.equal(defaultReviewCount(25), 10)
})

test('review count chips stay within recorded amount', () => {
  assert.deepEqual(reviewCountChoices(0), [])
  assert.deepEqual(reviewCountChoices(4), [4])
  assert.deepEqual(reviewCountChoices(10), [5, 10])
  assert.deepEqual(reviewCountChoices(25), [5, 10, 20, 25])
})

test('巩固 round takes the requested number of words and Q&A', () => {
  const pack = {
    id: 'class-a',
    titleZh: '示例',
    titleEn: 'Sample',
    blurb: '',
    words: [
      { id: 'a', english: 'a', chinese: '', pos: 'noun', article: 'a', image: '' },
      { id: 'b', english: 'b', chinese: '', pos: 'noun', article: 'a', image: '' },
      { id: 'c', english: 'c', chinese: '', pos: 'noun', article: 'a', image: '' },
    ],
    sentences: [
      { id: 's1', english: 'Q1', chinese: '', answer: '', answerZh: '' },
      { id: 's2', english: 'Q2', chinese: '', answer: '', answerZh: '' },
    ],
  }
  const sliced = sliceReviewPack(pack, { wordCount: 2, sentenceCount: 1 })
  assert.equal(sliced.words.length, 2)
  assert.equal(sliced.sentences.length, 1)
  const none = sliceReviewPack(pack, { wordCount: 0, sentenceCount: 2 })
  assert.equal(none.words.length, 0)
  assert.equal(none.sentences.length, 2)
})

test('takeRandom never exceeds the pool', () => {
  assert.deepEqual(takeRandom(['a'], 5), ['a'])
  assert.deepEqual(takeRandom(['a', 'b'], 0), [])
})
