import { it } from 'node:test'
import assert from 'node:assert/strict'

import { LANES } from '@toa.io/definitions/extensions.cadence'
import { row } from './row.ts'

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
