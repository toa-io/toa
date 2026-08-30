import { setTimeout } from 'node:timers/promises'
import { Quotas } from './Quotas'
import type { Remote } from '@toa.io/core'
import type { Configuration } from './Configuration'
import type { Input as Context, Output } from '../../../../io'

let quotas: Quotas
let configuration: Configuration
let context: Context
let output: Output
let counted: Request[]

beforeEach(() => {
  output = { status: 200 }
  counted = []
})

describe('common', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration()
    quotas = Quotas.create(configuration, createCounter())
  })

  it('should be ok', async () => {
    expect(quotas.ok(context, [])).toBe(true)

    await quotas.use(context, output)
  })

  it('should throttle', async () => {
    expect(quotas.ok(context, [])).toBe(true)

    await quotas.use(context, output)
    await quotas.use(context, output)

    expect(quotas.ok(context, [])).toBe(false)
  })

  it('should unblock after cooldown', async () => {
    await quotas.use(context, output)
    await quotas.use(context, output)

    expect(quotas.ok(context, [])).toBe(false)

    await timeout(configuration.cooldown)

    expect(quotas.ok(context, [])).toBe(true)
  })

  it('should count one request per key and interval', async () => {
    await quotas.use(context, output)

    expect(counted).toStrictEqual([
      { name: expect.any(String), interval: configuration.interval, amount: 1 }
    ])
  })
})

describe('group', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration()
  })

  it('should block on what the group counted, not on what this process did', async () => {
    // one request here, but the group is already at the limit
    quotas = Quotas.create(configuration, createCounter(() => configuration.requests))

    await quotas.use(context, output)

    expect(quotas.ok(context, [])).toBe(false)
  })

  it('should not block below the limit', async () => {
    quotas = Quotas.create(configuration, createCounter(() => configuration.requests - 1))

    await quotas.use(context, output)

    expect(quotas.ok(context, [])).toBe(true)
  })
})

describe('path', () => {
  beforeEach(() => {
    configuration = createConfiguration()
    quotas = Quotas.create(configuration, createCounter())
  })

  it('should have separate quotas', async () => {
    const one = createContext({ url: new URL('http://localhost/one/') })
    const two = createContext({ url: new URL('http://localhost/two/') })

    await quotas.use(one, output)
    await quotas.use(one, output)

    expect(quotas.ok(one, [])).toBe(false)
    expect(quotas.ok(two, [])).toBe(true)

    await quotas.use(two, output)
    await quotas.use(two, output)

    expect(quotas.ok(two, [])).toBe(false)
  })
})

describe('ip', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'ip' }] })
    quotas = Quotas.create(configuration, createCounter())
  })

  it('should have separate quotas', async () => {
    const one = createContext({ request: { headers: { 'x-forwarded-for': '1.1.1.1' } } })
    const two = createContext({ request: { headers: { 'x-forwarded-for': '2.2.2.2' } } })

    await quotas.use(one, output)
    await quotas.use(one, output)

    expect(quotas.ok(one, [])).toBe(false)
    expect(quotas.ok(two, [])).toBe(true)

    await quotas.use(two, output)
    await quotas.use(two, output)

    expect(quotas.ok(two, [])).toBe(false)
  })
})

describe('route', () => {
  it('should key on the route, not on the path it came in on', async () => {
    quotas = Quotas.create(createConfiguration({ key: [{ method: 'route' }] }),
      createCounter(), '/users/:id')

    const one = createContext({ url: new URL('http://localhost/users/1/') })
    const two = createContext({ url: new URL('http://localhost/users/2/') })

    await quotas.use(one, output)
    await quotas.use(two, output)

    // two paths, one route, one quota — which is the whole difference from `path`
    expect(counted[0].name).toBe(counted[1].name)
    expect(quotas.ok(one, [])).toBe(false)
  })

  it('should have separate quotas per route', async () => {
    const users = Quotas.create(createConfiguration({ key: [{ method: 'route' }] }),
      createCounter(), '/users/:id')

    const posts = Quotas.create(createConfiguration({ key: [{ method: 'route' }] }),
      createCounter(), '/posts/:id')

    context = createContext({ url: new URL('http://localhost/users/1/') })

    await users.use(context, output)
    await posts.use(context, output)

    expect(counted[0].name).not.toBe(counted[1].name)
  })
})

describe('segment', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'segment', options: 'id' }] })
    quotas = Quotas.create(configuration, createCounter())
  })

  it('should have separate quotas per segment value', async () => {
    context = createContext()

    const one = [{ name: 'id', value: '1' }]
    const two = [{ name: 'id', value: '2' }]

    quotas.ok(context, one)
    await quotas.use(context, output)
    quotas.ok(context, one)
    await quotas.use(context, output)

    expect(quotas.ok(context, one)).toBe(false)
    expect(quotas.ok(context, two)).toBe(true)
  })

  it('should count under the key preflight saw, which settle cannot recompute', async () => {
    const one = createContext()
    const two = createContext()

    quotas.ok(one, [{ name: 'id', value: '1' }])
    await quotas.use(one, output)

    quotas.ok(two, [{ name: 'id', value: '2' }])
    await quotas.use(two, output)

    // settle is handed no parameters, so recomputing there would hash an empty
    // segment both times and the two requests would count as one key
    expect(counted[0].name).not.toBe(counted[1].name)
  })
})

describe('identity', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'identity' }] })
    quotas = Quotas.create(configuration, createCounter())
  })

  it('should have separate quotas per identity', async () => {
    const one = createContext({ identity: { id: 'one' } })
    const two = createContext({ identity: { id: 'two' } })

    await quotas.use(one, output)
    await quotas.use(one, output)

    expect(quotas.ok(one, [])).toBe(false)
    expect(quotas.ok(two, [])).toBe(true)
  })

  it('should put every anonymous request in one quota', async () => {
    const one = createContext({ identity: null })
    const two = createContext()

    await quotas.use(one, output)
    await quotas.use(two, output)

    expect(quotas.ok(one, [])).toBe(false)
    expect(quotas.ok(two, [])).toBe(false)
  })
})

describe('status', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration({ condition: [{ method: 'status', options: 404 }] })
    quotas = Quotas.create(configuration, createCounter())
  })

  it('should not throttle on 200', async () => {
    await quotas.use(context, output)

    expect(quotas.ok(context, [])).toBe(true)
  })

  it('should not count what the condition rejects', async () => {
    await quotas.use(context, output)

    expect(counted).toStrictEqual([])
  })

  it('should throttle on 404', async () => {
    await quotas.use(context, { status: 404 })
    await quotas.use(context, { status: 404 })

    expect(quotas.ok(context, [])).toBe(false)
  })
})

function createConfiguration (properties?: Partial<Configuration>): Configuration {
  return Object.assign({ key: [{ method: 'path' }], requests: 2, interval: 10, cooldown: 10 },
    properties)
}

function createContext (properties?: any): Context {
  return Object.assign({ url: new URL('http://localhost/') }, properties) as unknown as Context
}

/**
 * Stands in for `exposition.stash`. Counting the way one participant does is enough
 * here: what a counter reports is comcount's business, and this asserts what the
 * quotas do with whatever number comes back.
 */
function createCounter (reply?: (count: number) => number): Promise<Remote> {
  const counts: Record<string, number> = {}

  const remote = {
    invoke: async (endpoint: string, request: { input: Request }): Promise<number> => {
      expect(endpoint).toBe('count')

      const { name, interval, amount } = request.input

      counted.push({ name, interval, amount })

      counts[name] = (counts[name] ?? 0) + amount

      return reply === undefined ? counts[name] : reply(counts[name])
    }
  }

  return Promise.resolve(remote as unknown as Remote)
}

async function timeout (ms: number): Promise<void> {
  await setTimeout(ms * 1.2)
}

interface Request {
  name: string
  interval: number
  amount: number
}
