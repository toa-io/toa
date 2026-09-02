import { Connector, Locator } from '@toa.io/core'
import { generate } from 'randomstring'
import { Aspect } from './Aspect'
import type { Client, Listener } from './Client'
import type { Manifest } from './manifest'

class Fake extends Connector {
  public readonly fetch = jest.fn(async () => ({ configuration: { foo: 'served' }, created: 5 }))
  public readonly subscribe = jest.fn()
  public readonly unsubscribe = jest.fn()
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
  expect(new Aspect(locator, manifest, null).name).toStrictEqual('configuration')
})

it('should resolve locally without a client', async () => {
  process.env['TOA_CONFIGURATION_' + locator.uppercase] = JSON.stringify({ foo: 'local' })

  const aspect = new Aspect(locator, manifest, null)

  await aspect.connect()

  expect(aspect.invoke()).toStrictEqual({ foo: 'local', bar: { baz: 'quux' } })
  expect(aspect.invoke(['foo'])).toStrictEqual('local')
  expect(aspect.invoke(['bar', 'baz'])).toStrictEqual('quux')
})

it('should fetch from the client and follow it', async () => {
  const client = new Fake()
  const aspect = new Aspect(locator, manifest, client as unknown as Client)

  await aspect.connect()

  expect(client.connected).toStrictEqual(true)
  expect(client.fetch).toHaveBeenCalledTimes(1)

  const [component, epoch] = client.fetch.mock.calls[0] as unknown as [string, string]

  expect(component).toStrictEqual(locator.id)
  expect(epoch).toMatch(/^[a-f0-9]{64}$/)
  expect(aspect.invoke()).toStrictEqual({ foo: 'served', bar: { baz: 'quux' } })

  expect(client.subscribe).toHaveBeenCalledWith(component, epoch, expect.any(Function))

  const listener = client.subscribe.mock.calls[0][2] as Listener

  listener({ configuration: { foo: 'updated' }, created: 6 })

  expect(aspect.invoke(['foo'])).toStrictEqual('updated')

  // what is not newer than the held value is left alone
  listener({ configuration: { foo: 'stale' }, created: 6 })
  listener({ configuration: { foo: 'older' }, created: 4 })

  expect(aspect.invoke(['foo'])).toStrictEqual('updated')

  // a value that does not fit keeps the previous one
  listener({ configuration: { foo: { nested: true } }, created: 7 })

  expect(aspect.invoke(['foo'])).toStrictEqual('updated')

  // and the one after it still applies
  listener({ configuration: { foo: 'latest' }, created: 8 })

  expect(aspect.invoke(['foo'])).toStrictEqual('latest')

  await aspect.disconnect()

  expect(client.unsubscribe).toHaveBeenCalledWith(component, epoch, listener)
})
