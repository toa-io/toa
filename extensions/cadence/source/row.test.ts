import { it } from 'node:test'
import assert from 'node:assert/strict'

import { LANES } from '@toa.io/definitions/extensions.cadence'
import { bound, following, recurring, row } from './row.ts'

const call = { endpoint: 'tea.pots.brew', due: 1000, overdue: 500 }

it('should bound a call by how late it may be', () => {
  assert.equal(row(call).expires, 1500)
  assert.equal(row({ ...call, overdue: 0 }).expires, 1000)
})

it('should bound a call that states no bound by the end of time', () => {
  assert.equal(row({ ...call, overdue: null }).expires, Number.MAX_SAFE_INTEGER)
})

it('should put a call in a lane', () => {
  for (let i = 0; i < 100; i++) {
    const { lane } = row(call)

    assert.ok(Number.isInteger(lane) && lane >= 0 && lane < LANES)
  }
})

it('should carry a request and a trail only where there is one', () => {
  assert.deepEqual(Object.keys(row(call)).sort(), ['due', 'endpoint', 'expires', 'lane'])

  const stored = row({ ...call, request: { input: 1 }, trail: ['a'] })

  assert.deepEqual(stored.request, { input: 1 })
  assert.deepEqual(stored.trail, ['a'])
})

// every second, and Mondays at nine
const SECOND = '* * * * * *'
const MONDAY = '0 9 * * 1'

// 2026-10-12 is a Monday
const NINE = Date.UTC(2026, 9, 12, 9)
const WEEK = 7 * 24 * 3600 * 1000

const schedule = { endpoint: 'tea.pots.brew', due: NINE, schedule: MONDAY, zone: 'UTC' }

it('should store what a schedule recurs by', () => {
  const stored = recurring({
    ...schedule,
    overdue: 60_000,
    request: { input: { pot: 1 } }
  })

  assert.equal(stored.schedule, MONDAY)
  assert.equal(stored.zone, 'UTC')
  assert.equal(stored.overdue, 60_000)
  assert.deepEqual(stored.request, { input: { pot: 1 } })
  assert.ok(Number.isInteger(stored.lane) && stored.lane >= 0 && stored.lane < LANES)
})

it('should expire a schedule at its end, and never where it has none', () => {
  assert.equal(recurring({ ...schedule, expires: NINE + WEEK }).expires, NINE + WEEK)
  assert.equal(recurring(schedule).expires, Number.MAX_SAFE_INTEGER)
  assert.ok(!('overdue' in recurring(schedule)))
})

it('should owe an occurrence until the next one is due', () => {
  assert.equal(bound(recurring(schedule)), NINE + WEEK)
})

it('should owe an occurrence for as long as the schedule states', () => {
  assert.equal(bound(recurring({ ...schedule, overdue: 3_600_000 })), NINE + 3_600_000)
})

it('should move on to the next occurrence after now', () => {
  const stored = recurring(schedule)

  assert.equal(following(stored, NINE + 1000), NINE + WEEK)

  // away for three weeks: one occurrence is owed, not every one that was missed
  assert.equal(following(stored, NINE + 3 * WEEK + 1000), NINE + 4 * WEEK)
})

it('should not move on to the occurrence it was at', () => {
  // made a moment early, or by a clock behind the one that wrote `due`
  const stored = recurring({ ...schedule, schedule: SECOND, due: 10_000 })

  assert.equal(following(stored, 9_990), 11_000)
})

it('should move on to nothing past its end', () => {
  assert.equal(
    following(recurring({ ...schedule, expires: NINE + WEEK - 1 }), NINE + 1),
    null
  )
  assert.equal(
    following(recurring({ ...schedule, expires: NINE + WEEK }), NINE + 1),
    NINE + WEEK
  )
})
