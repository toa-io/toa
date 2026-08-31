import { Sync } from './Sync'
import { Quotas } from './Quotas'
import type { Remote } from '@toa.io/core'
import type { Configuration } from './Configuration'
import type { Input as Context } from '../../../../io'

let sync: Sync
let invocations: Input[]
let context: Context

beforeEach(() => {
  jest.useFakeTimers()

  invocations = []
  context = createContext()
})

afterEach(() => {
  sync.dispose()

  jest.useRealTimers()
})

it('should tick as often as the shortest interval asks', async () => {
  sync = new Sync(createStash())

  const slow = createQuotas({ interval: 60_000 })

  // on its own a minute reconciles every two seconds, which is the cap
  sync.register(slow)
  slow.check(context, [])

  await tick()

  expect(invocations).toHaveLength(0)

  // a second asks for every 250ms, and the shortest sets the pace for all of them
  sync.register(createQuotas({ interval: 1000 }))

  await tick()

  expect(invocations).toHaveLength(1)
  expect(jest.getTimerCount()).toBe(1)
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

  expect(invocations).toHaveLength(1)
  expect(invocations[0].keys).toHaveLength(2)
  expect(invocations[0].deltas).toStrictEqual([50, 50])
})

it('should not call when there is nothing to report', async () => {
  sync = new Sync(createStash())

  sync.register(createQuotas())

  await tick()

  expect(invocations).toHaveLength(0)
})

it('should take the group debt back', async () => {
  sync = new Sync(createStash(() => [1000]))

  const quotas = createQuotas()

  sync.register(quotas)
  quotas.check(context, [])

  await tick()

  // one request here, but the group is already at capacity
  expect(quotas.check(context, [])).toBeGreaterThan(0)
})

it('should clear what it reported', async () => {
  sync = new Sync(createStash())

  const quotas = createQuotas()

  sync.register(quotas)
  quotas.check(context, [])

  await tick()
  await tick()

  expect(invocations).toHaveLength(1)
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

  expect(invocations).toHaveLength(2)
  expect(invocations[1].deltas).toStrictEqual([50])
  expect(quotas.check(context, [])).toBe(0)
})

async function tick (): Promise<void> {
  await jest.advanceTimersByTimeAsync(250)
}

function createQuotas (properties?: Partial<Configuration>): Quotas {
  const configuration = { key: [{ method: 'path' as const }], requests: 2, interval: 100 }

  return Quotas.create(Object.assign(configuration, properties))
}

function createContext (properties?: any): Context {
  return Object.assign({ url: new URL('http://localhost/'), identity: { id: 'one' } },
    properties) as unknown as Context
}

function createStash (reply?: (deltas: number[]) => number[]): Promise<Remote> {
  const remote = {
    invoke: async (endpoint: string, request: { input: Input }): Promise<number[]> => {
      expect(endpoint).toBe('meter')

      invocations.push(request.input)

      return reply === undefined ? request.input.deltas : reply(request.input.deltas)
    }
  }

  return Promise.resolve(remote as unknown as Remote)
}

interface Input {
  keys: string[]
  deltas: number[]
}
