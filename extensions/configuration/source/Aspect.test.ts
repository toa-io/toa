import { Connector, Locator } from '@toa.io/core'
import { generate } from 'randomstring'
import { Aspect } from './Aspect'
import type { Client, Listener } from './Client'
import type { Manifest } from './manifest'

class Fake extends Connector {
  public readonly fetch = jest.fn(async () => ({ foo: 'served' }))
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

  listener({ foo: 'updated' })

  expect(aspect.invoke(['foo'])).toStrictEqual('updated')

  // a value that does not fit keeps the previous one
  listener({ foo: { nested: true } })

  expect(aspect.invoke(['foo'])).toStrictEqual('updated')

  await aspect.disconnect()

  expect(client.unsubscribe).toHaveBeenCalledWith(component, epoch, listener)
})
