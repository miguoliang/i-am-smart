import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function presentParticiple(verb) {
  const v = verb.trim().toLowerCase()
  if (!v) return v
  if (v.endsWith('ie')) return `${v.slice(0, -2)}ying`
  if (v.endsWith('ee') || v.endsWith('ye')) return `${v}ing`
  if (v.endsWith('e')) return `${v.slice(0, -1)}ing`
  if (v.length <= 4 && /[^aeiou][aeiou][bdfglmnprst]$/.test(v)) {
    return `${v}${v.slice(-1)}ing`
  }
  return `${v}ing`
}

const pack = JSON.parse(
  readFileSync(join(root, 'web/public/content/sample-class.peilian.json'), 'utf8'),
)

test('sample class is one lesson with words and sentences', () => {
  assert.equal(pack.schema, 'peilian-pack/v1')
  assert.equal(pack.id, 'sample-class')
  assert.ok(pack.words.length >= 1)
  assert.ok(pack.sentences.length >= 1)
  const apple = pack.words.find((w) => w.english === 'apple')
  const run = pack.words.find((w) => w.english === 'run')
  const happy = pack.words.find((w) => w.english === 'happy')
  assert.equal(apple.pos, 'noun')
  assert.ok(apple.image)
  assert.equal(run.pos, 'verb')
  assert.equal(run.image, undefined)
  assert.equal(happy.pos, 'adjective')
  assert.equal(happy.image, undefined)
})

test('classroom sentence may omit chinese for later fill-in', () => {
  const water = pack.sentences.find((s) => s.english.includes('water'))
  assert.ok(water)
  assert.equal(water.chinese, undefined)
  const hello = pack.sentences.find((s) => s.english.startsWith('Hello'))
  assert.ok(hello.chinese)
})

test('sample class can split by subject for 分科巩固', () => {
  const pos = { noun: 0, verb: 0, adjective: 0 }
  for (const word of pack.words) pos[word.pos] += 1
  assert.ok(pos.noun >= 1)
  assert.ok(pos.verb >= 1)
  assert.ok(pos.adjective >= 1)
  assert.equal(
    pos.noun + pos.verb + pos.adjective,
    pack.words.length,
  )
  assert.ok(pack.sentences.length >= 1)
})

test('merged classes keep unique ids for 综合巩固', () => {
  const other = { ...pack, id: 'class-b' }
  const wordIds = [pack, other].flatMap((p) =>
    p.words.map((w) => `${p.id}__${w.id}`),
  )
  const sentenceIds = [pack, other].flatMap((p) =>
    p.sentences.map((s) => `${p.id}__${s.id}`),
  )
  assert.equal(new Set(wordIds).size, wordIds.length)
  assert.equal(new Set(sentenceIds).size, sentenceIds.length)
  assert.equal(wordIds.length, pack.words.length * 2)
})

test('live capture treats a phrase as a sentence', () => {
  const kind = (english) => {
    const text = english.trim()
    if (!text) return 'word'
    if (/\s/.test(text) || /[.?!！？。]$/.test(text)) return 'sentence'
    return 'word'
  }
  assert.equal(kind('banana'), 'word')
  assert.equal(kind('I like bananas.'), 'sentence')
  assert.equal(kind('Hello!'), 'sentence')
})

test('present participle matches KET action frames', () => {
  assert.equal(presentParticiple('run'), 'running')
  assert.equal(presentParticiple('sit'), 'sitting')
  assert.equal(presentParticiple('swim'), 'swimming')
  assert.equal(presentParticiple('eat'), 'eating')
  assert.equal(presentParticiple('write'), 'writing')
  assert.equal(presentParticiple('see'), 'seeing')
  assert.equal(presentParticiple('play'), 'playing')
})
