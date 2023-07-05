import { generate } from 'randomstring'
import { Connector, type Locator } from '@toa.io/core'
import { Connection } from './Connection'
import { Redis } from './Connection.fixtures'
import type * as redis from 'ioredis'

jest.mock('ioredis', () => ({
  Redis: jest.fn((nodes: string[], options: redis.ClusterOptions) => new Redis(nodes, options))
}))

let connection: Connection
let redises: Array<jest.MockedObject<redis.Redis>>

const urls = [generate(), generate(), generate()]

const locator = {
  namespace: generate(),
  name: generate()
} as unknown as Locator

beforeEach(() => {
  jest.clearAllMocks()

  connection = new Connection(urls, locator)
  redises = Redis.mock.results.map((result) => result.value)
})

it('should be instance of Connector', async () => {
  expect(connection)
    .toBeInstanceOf(Connector)
})

it('should connect', async () => {
  const keyPrefix = `${locator.namespace}:${locator.name}:`
  const options: redis.ClusterOptions = { keyPrefix, enableReadyCheck: true, lazyConnect: true }

  expect(Redis)
    .toHaveBeenCalledWith(urls[0], options)

  await connection.connect()

  for (const redis of redises)
    expect(redis.connect).toHaveBeenCalled()
})

it('should disconnect', async () => {
  await connection.disconnect()

  for (const redis of redises)
    expect(redis.disconnect).toHaveBeenCalled()
})

it('should expose cluster', async () => {
  expect(connection.redises)
    .toStrictEqual(redises)
})
