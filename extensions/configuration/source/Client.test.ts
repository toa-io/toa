import { Connector, type Locator, type Message, type Receiver } from '@toa.io/core'
import { timeout } from '@toa.io/generic'
import { Client, type Fetched } from './Client'
import { EVENT } from './const'
import type { Bootloader } from './Factory'

class Remote extends Connector {
  public readonly invoke = jest.fn(async (_endpoint: string, request: { input: Array<{ component: string, epoch: string }> }) =>
    request.input.map((pair): Fetched => ({ ...pair, configuration: this.values[pair.component] ?? null })))

  public values: Record<string, object | null> = {}
}

let remote: Remote
let receiver: Receiver | null
let boot: Bootloader
let client: Client

beforeEach(() => {
  remote = new Remote()
  receiver = null

  boot = {
    remote: jest.fn(async (locator: Locator) => {
      expect(locator.id).toStrictEqual('configuration.values')

      return remote
    }),
    receive: jest.fn(async (label: string, consumer: Receiver) => {
      expect(label).toStrictEqual(EVENT)

      receiver = consumer

      return new Connector()
    })
  } as unknown as Bootloader

  client = new Client(boot, { base: 10, max: 20, warn: 2 })
})

afterEach(async () => {
  await client.disconnect()
})

it('should send the requests of one tick as one call', async () => {
  remote.values = { 'a.one': { foo: 1 }, 'a.two': { foo: 2 } }

  await client.connect()

  const [one, two] = await Promise.all([client.fetch('a.one', 'e1'), client.fetch('a.two', 'e2')])

  expect(one).toStrictEqual({ foo: 1 })
  expect(two).toStrictEqual({ foo: 2 })
  expect(remote.invoke).toHaveBeenCalledTimes(1)
  expect(remote.invoke.mock.calls[0][1]).toStrictEqual({
    input: [{ component: 'a.one', epoch: 'e1' }, { component: 'a.two', epoch: 'e2' }]
  })
})

it('should keep asking until served', async () => {
  await client.connect()

  const fetching = client.fetch('a.one', 'e1')

  await timeout(25)

  expect(remote.invoke.mock.calls.length).toBeGreaterThanOrEqual(2)

  remote.values = { 'a.one': { foo: 1 } }

  expect(await fetching).toStrictEqual({ foo: 1 })
})

it('should answer null at once when told not to wait', async () => {
  await client.connect()

  expect(await client.fetch('a.one', 'e1', false)).toBeNull()
  expect(remote.invoke).toHaveBeenCalledTimes(1)
})

it('should refresh subscribers on the event', async () => {
  remote.values = { 'a.one': { foo: 1 } }

  await client.connect()
  await client.fetch('a.one', 'e1')

  const listener = jest.fn()
  const other = jest.fn()

  client.subscribe('a.one', 'e1', listener)
  client.subscribe('a.one', 'e0', other)

  remote.values = { 'a.one': { foo: 2 } }

  await receiver!.receive({ payload: { component: 'a.one', epoch: 'e1' } } satisfies Message)
  await timeout(15)

  expect(listener).toHaveBeenCalledWith({ foo: 2 })
  expect(other).not.toHaveBeenCalled()

  client.unsubscribe('a.one', 'e1', listener)

  await receiver!.receive({ payload: { component: 'a.one', epoch: 'e1' } } satisfies Message)
  await timeout(15)

  expect(listener).toHaveBeenCalledTimes(1)
})

it('should not wait for a refresh the service cannot serve', async () => {
  remote.values = { 'a.one': { foo: 1 } }

  await client.connect()
  await client.fetch('a.one', 'e1')

  const listener = jest.fn()

  client.subscribe('a.one', 'e1', listener)

  remote.values = {}

  await receiver!.receive({ payload: { component: 'a.one', epoch: 'e1' } } satisfies Message)
  await timeout(15)

  expect(listener).not.toHaveBeenCalled()
  expect(remote.invoke).toHaveBeenCalledTimes(2)
})
