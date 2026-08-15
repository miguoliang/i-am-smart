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

test('mixed sample allows verb and adjective without image', () => {
  const pack = JSON.parse(
    readFileSync(
      join(root, 'web/public/content/sample-week-mixed.peilian.json'),
      'utf8',
    ),
  )
  assert.equal(pack.schema, 'peilian-pack/v1')
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

test('present participle matches KET action frames', () => {
  assert.equal(presentParticiple('run'), 'running')
  assert.equal(presentParticiple('sit'), 'sitting')
  assert.equal(presentParticiple('swim'), 'swimming')
  assert.equal(presentParticiple('eat'), 'eating')
  assert.equal(presentParticiple('write'), 'writing')
  assert.equal(presentParticiple('see'), 'seeing')
  assert.equal(presentParticiple('play'), 'playing')
})
