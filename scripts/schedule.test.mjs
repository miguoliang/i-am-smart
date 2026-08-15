import assert from 'node:assert/strict'
import test from 'node:test'
import {
  nextMissingYmds,
  upcomingYmds,
} from '../web/src/content/schedule.ts'

test('Tue/Thu rule includes today when it is Tuesday', () => {
  const tuesday = new Date(2026, 7, 18)
  assert.equal(tuesday.getDay(), 2)
  const dates = upcomingYmds([2, 4], tuesday, 2)
  assert.deepEqual(dates, [
    '2026-08-18',
    '2026-08-20',
    '2026-08-25',
    '2026-08-27',
  ])
})

test('Tue/Thu rule from Wednesday starts at this Thursday', () => {
  const wednesday = new Date(2026, 7, 19)
  assert.equal(wednesday.getDay(), 3)
  const dates = upcomingYmds([2, 4], wednesday, 1)
  assert.deepEqual(dates, ['2026-08-20', '2026-08-25'])
})

test('re-scheduling skips dates already on the course', () => {
  const tuesday = new Date(2026, 7, 18)
  const missing = nextMissingYmds(
    [2, 4],
    ['2026-08-18', '2026-08-20'],
    2,
    tuesday,
  )
  assert.deepEqual(missing, [
    '2026-08-25',
    '2026-08-27',
    '2026-09-01',
    '2026-09-03',
  ])
})
