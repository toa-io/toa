import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'
import { Locator } from '@toa.io/core'
import { BINDING } from '@toa.io/definitions/extensions.convergence'

import { Factory } from './Factory.js'
import { Converging } from './Storage.js'
import type { extensions, storages } from '@toa.io/core/types'

let host: any
let factory: Factory
let warn: ReturnType<typeof mock.method<typeof console, 'warn'>>

const locator = new Locator('converging', 'mongo')
const manifest = { entity: {} }

const connector = (properties: object): any => ({
  ...properties,
  link: mock.fn(),
  connect: mock.fn(async () => undefined),
  disconnect: mock.fn(async () => undefined)
})

const storage = (merges?: boolean): storages.Storage =>
  connector({ merges, outbox: { collection: 'outbox' }, merge: mock.fn(async () => true) })

beforeEach(() => {
  mock.restoreAll()

  process.env[BINDING] = '@toa.io/bindings.amqp'
  warn = mock.method(console, 'warn', () => undefined)

  host = {
    outbound: mock.fn(async () => connector({ send: mock.fn(async () => undefined) })),
    inbound: mock.fn(async () => connector({}))
  }

  factory = new Factory(host as extensions.Host)
})

it('should contribute nothing where the deployment does not converge', () => {
  delete process.env[BINDING]

  assert.equal(factory.destination(locator, null, manifest), undefined)
})

it('should contribute nothing for a component that stores nothing', () => {
  assert.equal(factory.destination(locator, null, {}), undefined)
})

it('should leave alone a storage of a component it was given nothing for', () => {
  // what decorates a storage is every extension loaded in the process, so this is asked
  // about components that say `convergence: false` and about components of other manifests
  const one = storage(true)

  assert.equal(factory.storage(one, locator), one)
})

it('should decorate the storage of a component it converges', () => {
  factory.destination(locator, null, manifest)

  assert.ok(factory.storage(storage(true), locator) instanceof Converging)
})

it('should stand both halves down where the storage does not merge', async () => {
  const destination = factory.destination(locator, null, manifest)!
  const one = storage(undefined)

  assert.equal(factory.storage(one, locator), one)
  assert.equal(warn.mock.callCount(), 1)
  assert.match(warn.mock.calls[0].arguments[0] as string, /does not converge/)

  // and it publishes nothing, which would reach a queue no region declares
  await destination.connect()
  await destination.emit({ state: { id: '1' } } as any)

  assert.equal(host.outbound.mock.callCount(), 0)
})

it('should not decorate a component built after the one it was given', async () => {
  factory.destination(locator, null, manifest)

  assert.ok(factory.storage(storage(true), locator) instanceof Converging)

  // an extension is loaded once for the life of a process, and a suite builds `mongo.one`
  // in a composition that converges and again in one that does not
  const another = storage(true)

  assert.equal(factory.storage(another, locator), another)
})
