import { generate } from 'randomstring'
import { Connector, Locator } from '@toa.io/core'
import { Connection } from './Connection'
import { Redis } from './Connection.fixtures'
import type * as redis from 'ioredis'

jest.mock('ioredis', () => ({
  Redis: jest.fn((nodes: string[], options: redis.ClusterOptions) => new Redis(nodes, options))
}))

let connection: Connection
let redises: Array<jest.MockedObject<redis.Redis>>

const urls = [uri(), uri(), uri()]
const locator = new Locator(generate(), generate())

beforeAll(() => {
  process.env[`TOA_STASH_${locator.uppercase}`] = urls.join(' ')
})

afterAll(() => {
  process.env[`TOA_STASH_${locator.uppercase}`] = undefined
})

beforeEach(() => {
  jest.clearAllMocks()

  connection = new Connection(locator)
})

it('should be instance of Connector', async () => {
  expect(connection)
    .toBeInstanceOf(Connector)
})

it('should connect', async () => {
  await connection.connect()

  const keyPrefix = `${locator.namespace}:${locator.name}:`
  const options: redis.ClusterOptions = { keyPrefix, enableReadyCheck: true, lazyConnect: true }

  expect(Redis)
    .toHaveBeenCalledWith(urls[0], options)

  redises = Redis.mock.results.map((result) => result.value)

  for (const redis of redises)
    expect(redis.connect).toHaveBeenCalled()
})

it('should disconnect', async () => {
  await connection.connect()
  await connection.disconnect()

  redises = Redis.mock.results.map((result) => result.value)

  for (const redis of redises)
    expect(redis.disconnect).toHaveBeenCalled()
})

it('should expose cluster', async () => {
  await connection.connect()
  redises = Redis.mock.results.map((result) => result.value)

  expect(connection.redises)
    .toStrictEqual(redises)
})

function uri (): string {
  return 'redis://host-' + generate()
}
