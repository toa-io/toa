import { generate } from 'randomstring'
import { Connection } from './Connection'
import { Connector, type Locator } from '@toa.io/core'
import { Redis } from './Connection.fixtures'
import type * as redis from 'ioredis'

jest.mock('ioredis', () => ({
  Redis: jest.fn((nodes: string[], options: redis.ClusterOptions) => new Redis(nodes, options))
}))

let connection: Connection
let cluster: jest.MockedObject<redis.Cluster>

const url = generate()

const locator = {
  namespace: generate(),
  name: generate()
} as unknown as Locator

beforeEach(() => {
  jest.clearAllMocks()

  connection = new Connection(url, locator)
  cluster = Redis.mock.results[0].value
})

it('should be instance of Connector', async () => {
  expect(connection).toBeInstanceOf(Connector)
})

it('should connect', async () => {
  const keyPrefix = `${locator.namespace}:${locator.name}:`
  const options: redis.ClusterOptions = { keyPrefix, enableReadyCheck: true }

  expect(Redis).toHaveBeenCalledWith(url, options)

  // await connection.connect()
  //
  // expect(cluster.connect).toHaveBeenCalled()
})

it('should disconnect', async () => {
  await connection.disconnect()

  expect(cluster.disconnect).toHaveBeenCalled()
})

it('should expose cluster', async () => {
  expect(connection.redis).toStrictEqual(cluster)
})
