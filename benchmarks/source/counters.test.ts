import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { cpu, operations, perRequest } from './counters.ts'

describe('cpu', () => {
  it('should add user and system time, in seconds', () => {
    // the command may hold spaces and parentheses; fields are counted after the last `)`
    const stat =
      '4242 (node (toa) x) S 1 4242 4242 0 -1 4194560 1000 0 0 0 250 50 0 0 20 0 11 0 100 0 0'

    assert.equal(cpu(stat, 100), 3)
  })
})

describe('operations', () => {
  it('should sum what was sent to the collections of one database', () => {
    const totals = {
      note: 'all times in microseconds',
      'toa-bench-a.default_bench': counts({ queries: 3, insert: 2, update: 1, getmore: 1, remove: 1, commands: 2 }),
      'toa-bench-a.default_bench_outbox': counts({ queries: 40 }),
      'toa-bench-b.default_bench': counts({ queries: 1000 }),
      'toa-bench-ab.default_bench': counts({ queries: 1000 })
    }

    assert.equal(operations(totals, 'toa-bench-a'), 50)
  })
})

describe('perRequest', () => {
  it('should subtract the background at its idle rate', () => {
    const result = perRequest({
      before: { publish: 1000, operations: 500 },
      after: { publish: 3050, operations: 3620 },
      seconds: 10,
      requests: 1000,
      background: { publish: 5, operations: 12 }
    })

    assert.deepEqual(result, { publish: 2, operations: 3 })
  })

  it('should refuse a window with no requests', () => {
    assert.throws(() =>
      perRequest({
        before: { publish: 0, operations: 0 },
        after: { publish: 0, operations: 0 },
        seconds: 10,
        requests: 0,
        background: { publish: 0, operations: 0 }
      })
    )
  })
})

function counts(values: Partial<Record<string, number>>): Record<string, { time: number; count: number }> {
  const names = ['total', 'readLock', 'writeLock', 'queries', 'getmore', 'insert', 'update', 'remove', 'commands']

  return Object.fromEntries(names.map((name) => [name, { time: 0, count: values[name] ?? 0 }]))
}
