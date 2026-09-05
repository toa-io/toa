import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import { Connector, type Locator, type Receiver } from '@toa.io/core'
import type { Message } from '@toa.io/core/types'
import { timeout } from '@toa.io/generic'
import { Client, type Fetched } from './Client.js'
import { EVENT } from './const.js'
import type { Host } from './Factory.js'

class Remote extends Connector {
  public readonly invoke = mock.fn(async (_endpoint: string, request: { input: Array<{ component: string, epoch: string }> }) =>
    request.input.map((pair): Fetched => ({
      ...pair,
      configuration: this.values[pair.component] ?? null,
      created: this.values[pair.component] === undefined ? 0 : 7
    })))

  public values: Record<string, object | null> = {}
}

let remote: Remote
let receiver: Receiver | null
let host: Host
let client: Client

beforeEach(() => {
  remote = new Remote()
  receiver = null

  host = {
    remote: mock.fn(async (locator: Locator) => {
      assert.deepStrictEqual(locator.id, 'configuration.values')

      return remote
    }),
    receive: mock.fn(async (label: string, consumer: Receiver) => {
      assert.deepStrictEqual(label, EVENT)

      receiver = consumer

      return new Connector()
    })
  } as unknown as Host

  client = new Client(host, { base: 10, max: 20, warn: 2 })
})

afterEach(async () => {
  await client.disconnect()
})

it('should send the requests of one tick as one call', async () => {
  remote.values = { 'a.one': { foo: 1 }, 'a.two': { foo: 2 } }

  await client.connect()

  const [one, two] = await Promise.all([client.fetch('a.one', 'e1'), client.fetch('a.two', 'e2')])

  assert.deepStrictEqual(one, { configuration: { foo: 1 }, created: 7 })
  assert.deepStrictEqual(two, { configuration: { foo: 2 }, created: 7 })
  assert.strictEqual(remote.invoke.mock.callCount(), 1)
  assert.deepStrictEqual(remote.invoke.mock.calls[0].arguments[1], {
    input: [{ component: 'a.one', epoch: 'e1' }, { component: 'a.two', epoch: 'e2' }]
  })
})

it('should keep asking until served', async () => {
  await client.connect()

  const fetching = client.fetch('a.one', 'e1')
  const deadline = Date.now() + 1000

  while (remote.invoke.mock.calls.length < 2 && Date.now() < deadline)
    await timeout(5)

  assert.ok(remote.invoke.mock.calls.length >= 2)

  remote.values = { 'a.one': { foo: 1 } }

  assert.deepStrictEqual((await fetching).configuration, { foo: 1 })
})

it('should hand a created object to its subscribers', async () => {
  await client.connect()

  const listener = mock.fn()
  const other = mock.fn()

  client.subscribe('a.one', 'e1', listener)
  client.subscribe('a.one', 'e0', other)

  await receiver!.receive({
    payload: { component: 'a.one', epoch: 'e1', configuration: { foo: 2 }, CREATED: 12 }
  } satisfies Message)

  assert.ok(listener.mock.calls.some((call: any) => call.arguments.length === 1 && isDeepStrictEqual(call.arguments[0], { configuration: { foo: 2 }, created: 12 })))
  assert.strictEqual(other.mock.callCount(), 0)
  assert.strictEqual(remote.invoke.mock.callCount(), 0)

  client.unsubscribe('a.one', 'e1', listener)

  await receiver!.receive({
    payload: { component: 'a.one', epoch: 'e1', configuration: { foo: 3 }, CREATED: 13 }
  } satisfies Message)

  assert.strictEqual(listener.mock.callCount(), 1)
})
