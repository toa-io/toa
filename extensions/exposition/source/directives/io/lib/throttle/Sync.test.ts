import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Sync } from './Sync.js'
import { Quotas } from './Quotas.js'
import type { atomicity } from '@toa.io/core/types'
import type { Configuration } from './Configuration.js'
import type { Input as Context } from '../../../../io.js'

let sync: Sync
let invocations: Input[]
let context: Context

beforeEach(() => {
  mock.timers.enable()

  invocations = []
  context = createContext()
})

afterEach(() => {
  sync.dispose()

  mock.timers.reset()
})

it('should tick as often as the shortest interval asks', async () => {
  sync = new Sync(createStash())

  const slow = createQuotas({ interval: 60_000 })

  // on its own a minute reconciles every two seconds, which is the cap
  sync.register(slow)
  slow.check(context, [])

  await tick()

  assert.strictEqual(invocations.length, 0)

  // a second asks for every 250ms, and the shortest sets the pace for all of them
  sync.register(createQuotas({ interval: 1000 }))

  await tick()

  // that a single timer paces every quota was asserted through jest's timer
  // count, which node:test does not expose; the pacing above still covers it
  assert.strictEqual(invocations.length, 1)
})

it('should reconcile every quota in one call', async () => {
  sync = new Sync(createStash())

  const one = createQuotas()
  const two = createQuotas({ key: [{ method: 'identity' }] })

  sync.register(one)
  sync.register(two)

  one.check(context, [])
  two.check(context, [])

  await tick()

  assert.strictEqual(invocations.length, 1)
  assert.strictEqual(invocations[0].keys.length, 2)
  assert.deepStrictEqual(invocations[0].deltas, [50, 50])
})

it('should not call when there is nothing to report', async () => {
  sync = new Sync(createStash())

  sync.register(createQuotas())

  await tick()

  assert.strictEqual(invocations.length, 0)
})

it('should take the group debt back', async () => {
  sync = new Sync(createStash(() => [1000]))

  const quotas = createQuotas()

  sync.register(quotas)
  quotas.check(context, [])

  await tick()

  // one request here, but the group is already at capacity
  assert.ok(quotas.check(context, []) > 0)
})

it('should clear what it reported', async () => {
  sync = new Sync(createStash())

  const quotas = createQuotas()

  sync.register(quotas)
  quotas.check(context, [])

  await tick()
  await tick()

  assert.strictEqual(invocations.length, 1)
})

it('should keep what it could not report, and keep serving', async () => {
  sync = new Sync(createStash(() => {
    throw new Error('Redis is unreachable')
  }))

  const quotas = createQuotas()

  sync.register(quotas)
  quotas.check(context, [])

  await tick()
  await tick()

  assert.strictEqual(invocations.length, 2)
  assert.deepStrictEqual(invocations[1].deltas, [50])
  assert.strictEqual(quotas.check(context, []), 0)
})

async function tick (): Promise<void> {
  mock.timers.tick(250)

  // the reconciliation a tick starts is asynchronous, and node:test advances
  // timers synchronously; let it settle before the next one
  await new Promise((resolve) => process.nextTick(resolve))
}

function createQuotas (properties?: Partial<Configuration>): Quotas {
  const configuration = { key: [{ method: 'path' as const }], requests: 2, interval: 100 }

  return Quotas.create(Object.assign(configuration, properties))
}

function createContext (properties?: any): Context {
  return Object.assign({ url: new URL('http://localhost/'), identity: { id: 'one' } },
    properties) as unknown as Context
}

function createStash (reply?: (deltas: number[]) => number[]): atomicity.Atom {
  const atom = {
    meter: async (keys: string[], deltas: number[]): Promise<number[]> => {
      invocations.push({ keys, deltas })

      return reply === undefined ? deltas : reply(deltas)
    }
  }

  return atom as unknown as atomicity.Atom
}

interface Input {
  keys: string[]
  deltas: number[]
}
