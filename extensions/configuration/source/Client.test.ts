import { Connector, type Locator, type Message, type Receiver } from '@toa.io/core'
import { timeout } from '@toa.io/generic'
import { Client, type Fetched } from './Client.js'
import { EVENT } from './const.js'
import type { Bootloader } from './Factory.js'

class Remote extends Connector {
  public readonly invoke = jest.fn(async (_endpoint: string, request: { input: Array<{ component: string, epoch: string }> }) =>
    request.input.map((pair): Fetched => ({
      ...pair,
      configuration: this.values[pair.component] ?? null,
      created: this.values[pair.component] === undefined ? 0 : 7
    })))

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

  expect(one).toStrictEqual({ configuration: { foo: 1 }, created: 7 })
  expect(two).toStrictEqual({ configuration: { foo: 2 }, created: 7 })
  expect(remote.invoke).toHaveBeenCalledTimes(1)
  expect(remote.invoke.mock.calls[0][1]).toStrictEqual({
    input: [{ component: 'a.one', epoch: 'e1' }, { component: 'a.two', epoch: 'e2' }]
  })
})

it('should keep asking until served', async () => {
  await client.connect()

  const fetching = client.fetch('a.one', 'e1')
  const deadline = Date.now() + 1000

  while (remote.invoke.mock.calls.length < 2 && Date.now() < deadline)
    await timeout(5)

  expect(remote.invoke.mock.calls.length).toBeGreaterThanOrEqual(2)

  remote.values = { 'a.one': { foo: 1 } }

  expect((await fetching).configuration).toStrictEqual({ foo: 1 })
})

it('should hand a created object to its subscribers', async () => {
  await client.connect()

  const listener = jest.fn()
  const other = jest.fn()

  client.subscribe('a.one', 'e1', listener)
  client.subscribe('a.one', 'e0', other)

  await receiver!.receive({
    payload: { component: 'a.one', epoch: 'e1', configuration: { foo: 2 }, _created: 12 }
  } satisfies Message)

  expect(listener).toHaveBeenCalledWith({ configuration: { foo: 2 }, created: 12 })
  expect(other).not.toHaveBeenCalled()
  expect(remote.invoke).not.toHaveBeenCalled()

  client.unsubscribe('a.one', 'e1', listener)

  await receiver!.receive({
    payload: { component: 'a.one', epoch: 'e1', configuration: { foo: 3 }, _created: 13 }
  } satisfies Message)

  expect(listener).toHaveBeenCalledTimes(1)
})
