import { it } from 'node:test'
import assert from 'node:assert/strict'

import { occurrences } from './schedule.ts'

const at = (iso: string): number => new Date(iso).getTime()

it('should answer what comes first after a moment', () => {
  const next = occurrences('0 12 * * 1-5', 'UTC')

  // a Saturday night, so the next weekday noon is Monday's
  assert.equal(next(at('2026-10-03T22:00:00Z')), at('2026-10-05T12:00:00Z'))
})

it('should answer what comes after an occurrence, and not the occurrence', () => {
  const next = occurrences('0 12 * * 1-5', 'UTC')

  assert.equal(next(at('2026-10-05T12:00:00Z')), at('2026-10-06T12:00:00Z'))
})

it('should read the expression in its zone, across a change of offset', () => {
  const next = occurrences('0 9 * * *', 'Europe/Berlin')

  // summer time ends on the 25th: nine in the morning is seven UTC before it and eight after
  assert.equal(next(at('2026-10-24T00:00:00Z')), at('2026-10-24T07:00:00Z'))
  assert.equal(next(at('2026-10-25T07:00:00Z')), at('2026-10-25T08:00:00Z'))
})

it('should read a first field of seconds where there are six', () => {
  const next = occurrences('*/2 * * * * *', 'UTC')

  assert.equal(next(1000), 2000)
  assert.equal(next(2000), 4000)
})

it('should refuse what is not five or six fields', () => {
  assert.throws(() => occurrences('* * * *', 'UTC'), /five or six fields/)
  assert.throws(() => occurrences('@daily', 'UTC'), /five or six fields/)
  assert.throws(() => occurrences('0 0 12 * * * 2040', 'UTC'), /five or six fields/)
})
