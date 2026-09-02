import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Connector, Locator } from '@toa.io/core'
import { generate } from 'randomstring'
import { Aspect } from './Aspect.js'
import type { Client, Listener } from './Client.js'
import type { Manifest } from './manifest.js'

class Fake extends Connector {
  public readonly fetch = mock.fn(async () => ({ configuration: { foo: 'served' }, created: 5 }))
  public readonly subscribe = mock.fn()
  public readonly unsubscribe = mock.fn()
}

const manifest: Manifest = {
  schema: {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      bar: { type: 'object', properties: { baz: { type: 'string' } }, default: { baz: 'quux' } }
    }
  }
}

let locator: Locator

beforeEach(() => {
  locator = new Locator(generate(), generate())
})

afterEach(() => {
  delete process.env['TOA_CONFIGURATION_' + locator.uppercase]
})

it('should be named', async () => {
  assert.deepStrictEqual(new Aspect(locator, manifest, null).name, 'configuration')
})

it('should resolve locally without a client', async () => {
  process.env['TOA_CONFIGURATION_' + locator.uppercase] = JSON.stringify({ foo: 'local' })

  const aspect = new Aspect(locator, manifest, null)

  await aspect.connect()

  assert.deepStrictEqual(aspect.invoke(), { foo: 'local', bar: { baz: 'quux' } })
  assert.deepStrictEqual(aspect.invoke(['foo']), 'local')
  assert.deepStrictEqual(aspect.invoke(['bar', 'baz']), 'quux')
})

it('should fetch from the client and follow it', async () => {
  const client = new Fake()
  const aspect = new Aspect(locator, manifest, client as unknown as Client)

  await aspect.connect()

  assert.deepStrictEqual(client.connected, true)
  assert.strictEqual(client.fetch.mock.callCount(), 1)

  const [component, epoch] = client.fetch.mock.calls[0].arguments as unknown as [string, string]

  assert.deepStrictEqual(component, locator.id)
  assert.match(epoch, /^[a-f0-9]{64}$/)
  assert.deepStrictEqual(aspect.invoke(), { foo: 'served', bar: { baz: 'quux' } })

  assert.ok(client.subscribe.mock.calls.some((call: any) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], component) && isDeepStrictEqual(call.arguments[1], epoch) && typeof call.arguments[2] === 'function'))

  const listener = client.subscribe.mock.calls[0].arguments[2] as Listener

  listener({ configuration: { foo: 'updated' }, created: 6 })

  assert.deepStrictEqual(aspect.invoke(['foo']), 'updated')

  // what is not newer than the held value is left alone
  listener({ configuration: { foo: 'stale' }, created: 6 })
  listener({ configuration: { foo: 'older' }, created: 4 })

  assert.deepStrictEqual(aspect.invoke(['foo']), 'updated')

  // a value that does not fit keeps the previous one
  listener({ configuration: { foo: { nested: true } }, created: 7 })

  assert.deepStrictEqual(aspect.invoke(['foo']), 'updated')

  // and the one after it still applies
  listener({ configuration: { foo: 'latest' }, created: 8 })

  assert.deepStrictEqual(aspect.invoke(['foo']), 'latest')

  await aspect.disconnect()

  assert.ok(client.unsubscribe.mock.calls.some((call: any) => call.arguments.length === 3 && isDeepStrictEqual(call.arguments[0], component) && isDeepStrictEqual(call.arguments[1], epoch) && isDeepStrictEqual(call.arguments[2], listener)))
})
