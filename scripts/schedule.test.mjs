import assert from 'node:assert/strict'
import test from 'node:test'
import {
  nextMissingYmds,
  upcomingYmds,
  monthCells,
  monthTitle,
  shiftYearMonth,
  packForYmd,
  courseForWeekday,
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

test('August 2026 calendar grid starts on Monday 27 Jul', () => {
  const cells = monthCells(2026, 7)
  assert.equal(cells.length, 42)
  assert.equal(cells[0]?.ymd, '2026-07-27')
  assert.equal(cells[0]?.inMonth, false)
  assert.equal(cells[5]?.ymd, '2026-08-01')
  assert.equal(cells[5]?.inMonth, true)
  assert.equal(monthTitle(2026, 7), '2026年8月')
  assert.deepEqual(shiftYearMonth(2026, 7, 1), { year: 2026, month: 8 })
  assert.deepEqual(shiftYearMonth(2026, 0, -1), { year: 2025, month: 11 })
})

test('packForYmd prefers a class that already has notes', () => {
  const empty = {
    id: 'empty',
    source: 'custom',
    scheduledOn: '2026-08-18',
    words: [],
    sentences: [],
  }
  const filled = {
    id: 'filled',
    source: 'custom',
    scheduledOn: '2026-08-18',
    words: [{ english: 'apple' }],
    sentences: [],
  }
  assert.equal(packForYmd([empty, filled], '2026-08-18')?.id, 'filled')
  assert.equal(packForYmd([empty], '2026-08-19'), null)
  assert.equal(courseForWeekday([{ weekdays: [2, 4] }], 2)?.weekdays[0], 2)
  assert.equal(courseForWeekday([{ weekdays: [2, 4] }], 3), undefined)
})
