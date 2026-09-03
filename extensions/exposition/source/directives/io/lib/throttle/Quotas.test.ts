import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { setTimeout } from 'node:timers/promises'
import { Quotas } from './Quotas.js'
import type { Batch } from './Sync.js'
import type { Configuration } from './Configuration.js'
import type { Input as Context, Output } from '../../../../io.js'

let quotas: Quotas
let configuration: Configuration
let context: Context
let output: Output

beforeEach(() => {
  output = { status: 200 }
})

describe('common', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration()
    quotas = Quotas.create(configuration)
  })

  it('should admit a burst of the whole budget', () => {
    assert.strictEqual(quotas.check(context, []), 0)
    assert.strictEqual(quotas.check(context, []), 0)
  })

  it('should refuse past the budget', () => {
    quotas.check(context, [])
    quotas.check(context, [])

    assert.ok(quotas.check(context, []) > 0)
  })

  it('should not charge what it refuses', async () => {
    quotas.check(context, [])
    quotas.check(context, [])
    quotas.check(context, [])
    quotas.check(context, [])

    // a refused request does not push admission further out, so one emission is
    // all it takes to be admitted again however hard the key is hammered
    await timeout(configuration.interval / configuration.requests)

    assert.strictEqual(quotas.check(context, []), 0)
  })

  it('should earn the budget back over the interval', async () => {
    quotas.check(context, [])
    quotas.check(context, [])

    assert.ok(quotas.check(context, []) > 0)

    await timeout(configuration.interval)

    assert.strictEqual(quotas.check(context, []), 0)
    assert.strictEqual(quotas.check(context, []), 0)
  })
})

describe('retry', () => {
  it('should answer the seconds until the request would be admitted', () => {
    // an emission is 5 seconds, which is what the budget takes to earn one back
    quotas = Quotas.create(createConfiguration({ requests: 2, interval: 10_000 }))
    context = createContext()

    quotas.check(context, [])
    quotas.check(context, [])

    assert.strictEqual(quotas.check(context, []), 5)
  })

  it('should never answer zero when it refuses', () => {
    quotas = Quotas.create(createConfiguration({ requests: 10, interval: 1000 }))
    context = createContext()

    for (let i = 0; i < 10; i++)
      quotas.check(context, [])

    // an emission here is a tenth of a second, and `Retry-After` counts in whole ones
    assert.strictEqual(quotas.check(context, []), 1)
  })
})

describe('group', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration()
    quotas = Quotas.create(configuration)
  })

  it('should report what it has charged', () => {
    quotas.check(context, [])

    const batch = flush()

    assert.strictEqual(batch.length, 1)
    assert.strictEqual(batch[0].delta, configuration.interval / configuration.requests)
    assert.strictEqual(batch[0].quotas, quotas)
  })

  it('should refuse on what the group has spent, not on what this process has', () => {
    quotas.check(context, [])

    const batch = flush()

    // one request here, but the group is already at capacity
    quotas.settled(batch[0], configuration.interval, Date.now())

    assert.ok(quotas.check(context, []) > 0)
  })

  it('should not refuse below the capacity', () => {
    quotas.check(context, [])

    const batch = flush()

    quotas.settled(batch[0], 0, Date.now())

    assert.strictEqual(quotas.check(context, []), 0)
  })

  it('should clear what was reported, and keep what was charged since', () => {
    quotas.check(context, [])

    const batch = flush()

    quotas.check(context, [])
    quotas.settled(batch[0], 0, Date.now())

    assert.strictEqual(flush()[0].delta, configuration.interval / configuration.requests)
  })

  it('should keep what it could not report', () => {
    quotas.check(context, [])

    const first = flush()

    // no `settled`, as a tick that cannot reach Redis leaves the debt to the next one
    assert.strictEqual(flush()[0].delta, first[0].delta)
  })

  it('should take a debt for a key it has already dropped', () => {
    quotas.check(context, [])

    const batch = flush()

    quotas.settled(batch[0], 0, Date.now())
    flush(Date.now() + configuration.interval)

    quotas.settled({ ...batch[0], delta: 0 }, configuration.interval, Date.now())

    assert.ok(quotas.check(context, []) > 0)
  })

  it('should name keys so that quotas with different budgets never share one', () => {
    const other = Quotas.create(createConfiguration({ requests: 3 }))

    quotas.check(context, [])
    other.check(context, [])

    const batch = flush(Date.now(), quotas, other)

    assert.strictEqual(batch[0].key, batch[1].key)
    assert.notStrictEqual(quotas.name(batch[0].key), other.name(batch[1].key))
  })
})

describe('sweeping', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration()
    quotas = Quotas.create(configuration)
  })

  it('should drop a key that is out of debt with nothing to report', () => {
    quotas.check(context, [])

    const batch = flush()

    quotas.settled(batch[0], 0, Date.now())

    // once the debt has drained, a key says no more than an absent one
    assert.strictEqual(flush(Date.now() + configuration.interval).length, 0)
    assert.strictEqual(flush(Date.now() + configuration.interval).length, 0)
    assert.strictEqual(quotas.check(context, []), 0)
  })

  it('should keep a key that still owes something', () => {
    quotas.check(context, [])

    assert.strictEqual(flush(Date.now() + configuration.interval).length, 1)
  })
})

describe('path', () => {
  beforeEach(() => {
    configuration = createConfiguration()
    quotas = Quotas.create(configuration)
  })

  it('should have separate quotas', () => {
    const one = createContext({ url: new URL('http://localhost/one/') })
    const two = createContext({ url: new URL('http://localhost/two/') })

    quotas.check(one, [])
    quotas.check(one, [])

    assert.ok(quotas.check(one, []) > 0)
    assert.strictEqual(quotas.check(two, []), 0)
  })
})

describe('ip', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'ip' }] })
  })

  it('should key on the connection by default', () => {
    quotas = Quotas.create(configuration)

    const one = createContext({ request: { headers: { 'x-forwarded-for': '1.1.1.1' }, socket: { remoteAddress: '9.9.9.9' } } })
    const two = createContext({ request: { headers: { 'x-forwarded-for': '2.2.2.2' }, socket: { remoteAddress: '9.9.9.9' } } })

    quotas.check(one, [])
    quotas.check(one, [])

    // the header the client wrote is not what tells the two apart
    assert.ok(quotas.check(two, []) > 0)
  })

  it('should key on the named header, by its last value', () => {
    quotas = Quotas.create(configuration, '', 'x-forwarded-for')

    const one = createContext({ request: { headers: { 'x-forwarded-for': '8.8.8.8, 1.1.1.1' }, socket: {} } })
    const two = createContext({ request: { headers: { 'x-forwarded-for': '8.8.8.8, 2.2.2.2' }, socket: {} } })

    quotas.check(one, [])
    quotas.check(one, [])

    assert.ok(quotas.check(one, []) > 0)
    assert.strictEqual(quotas.check(two, []), 0)
  })
})

describe('route', () => {
  it('should key on the route, not on the path it came in on', () => {
    quotas = Quotas.create(createConfiguration({ key: [{ method: 'route' }] }), '/users/:id')

    const one = createContext({ url: new URL('http://localhost/users/1/') })
    const two = createContext({ url: new URL('http://localhost/users/2/') })

    quotas.check(one, [])
    quotas.check(two, [])

    // two paths, one route, one quota — which is the whole difference from `path`
    assert.strictEqual(flush().length, 1)
    assert.ok(quotas.check(one, []) > 0)
  })

  it('should have separate quotas per route', () => {
    const users = Quotas.create(createConfiguration({ key: [{ method: 'route' }] }), '/users/:id')
    const posts = Quotas.create(createConfiguration({ key: [{ method: 'route' }] }), '/posts/:id')

    context = createContext({ url: new URL('http://localhost/users/1/') })

    users.check(context, [])
    posts.check(context, [])

    const batch = flush(Date.now(), users, posts)

    assert.notStrictEqual(batch[0].key, batch[1].key)
  })
})

describe('segment', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'segment', options: 'id' }] })
    quotas = Quotas.create(configuration)
    context = createContext()
  })

  it('should have separate quotas per segment value', () => {
    const one = [{ name: 'id', value: '1' }]
    const two = [{ name: 'id', value: '2' }]

    quotas.check(context, one)
    quotas.check(context, one)

    assert.ok(quotas.check(context, one) > 0)
    assert.strictEqual(quotas.check(context, two), 0)
  })
})

describe('identity', () => {
  beforeEach(() => {
    configuration = createConfiguration({ key: [{ method: 'identity' }] })
    quotas = Quotas.create(configuration)
  })

  it('should have separate quotas per identity', () => {
    const one = createContext({ identity: { id: 'one' } })
    const two = createContext({ identity: { id: 'two' } })

    quotas.check(one, [])
    quotas.check(one, [])

    assert.ok(quotas.check(one, []) > 0)
    assert.strictEqual(quotas.check(two, []), 0)
  })

  it('should put every anonymous request in one quota', () => {
    const one = createContext({ identity: null })
    const two = createContext()

    quotas.check(one, [])
    quotas.check(two, [])

    assert.ok(quotas.check(one, []) > 0)
    assert.ok(quotas.check(two, []) > 0)
  })
})

describe('status', () => {
  beforeEach(() => {
    context = createContext()
    configuration = createConfiguration({ condition: [{ method: 'status', options: 404 }] })
    quotas = Quotas.create(configuration)
  })

  it('should not charge before the response can be matched', () => {
    quotas.check(context, [])
    quotas.check(context, [])
    quotas.check(context, [])

    // only the response tells whether a request counts, so checking cannot charge
    assert.strictEqual(flush().length, 0)
  })

  it('should not charge what the condition rejects', () => {
    quotas.check(context, [])
    quotas.use(context, output)

    assert.strictEqual(flush().length, 0)
    assert.strictEqual(quotas.check(context, []), 0)
  })

  it('should charge what the condition accepts', () => {
    for (let i = 0; i < 2; i++) {
      quotas.check(context, [])
      quotas.use(context, { status: 404 })
    }

    assert.ok(quotas.check(context, []) > 0)
  })

  it('should charge the key checking saw, which settling cannot recompute', () => {
    const keys = [{ method: 'segment' as const, options: 'id' }]

    quotas = Quotas.create(createConfiguration({ key: keys, condition: configuration.condition }))

    const one = createContext()
    const two = createContext()

    quotas.check(one, [{ name: 'id', value: '1' }])
    quotas.use(one, { status: 404 })

    quotas.check(two, [{ name: 'id', value: '2' }])
    quotas.use(two, { status: 404 })

    // settling is handed no parameters, so recomputing there would hash an empty
    // segment both times and the two requests would charge one key
    assert.strictEqual(flush().length, 2)
  })
})

function flush (now: number = Date.now(), ...of: Quotas[]): Batch[] {
  const batch: Batch[] = []

  for (const one of of.length === 0 ? [quotas] : of)
    one.flush(now, batch)

  return batch
}

function createConfiguration (properties?: Partial<Configuration>): Configuration {
  return Object.assign({ key: [{ method: 'path' }], requests: 2, interval: 100 }, properties)
}

function createContext (properties?: any): Context {
  return Object.assign({ url: new URL('http://localhost/') }, properties) as unknown as Context
}

async function timeout (ms: number): Promise<void> {
  await setTimeout(ms * 1.2)
}
