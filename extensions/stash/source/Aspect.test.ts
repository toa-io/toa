import Redlock from 'redlock-temp-fix'
import { encode } from 'msgpackr'
import { generate } from 'randomstring'
import { Aspect } from './Aspect'
import * as mock from './Connection.fixtures'
import type { Connection } from './Connection'
import type { Cluster } from 'ioredis'

jest.mock('redlock-temp-fix')

let aspect: Aspect
let connection: jest.MockedObject<Connection>
let redis: jest.MockedObject<Cluster>
let redlock: jest.MockedObject<Redlock>

const key = generate()

beforeEach(() => {
  jest.clearAllMocks()

  connection = new mock.Connection() as unknown as jest.MockedObject<Connection>
  redis = connection.redis as unknown as jest.MockedObject<Cluster>
  aspect = new Aspect(connection)

  redlock = (Redlock as unknown as jest.Mock<Redlock>).mock
    .instances[0] as unknown as jest.MockedObject<Redlock>
})

it('should depend on Connection', async () => {
  expect(connection.link)
    .toHaveBeenCalledWith(aspect)
})

it('should set', async () => {
  const value = generate()

  await aspect.invoke('set', key, value)

  expect(redis.set)
    .toHaveBeenCalledWith(key, value)
})

it('should get', async () => {
  const value = await aspect.invoke('get', key)

  expect(redis.get)
    .toHaveBeenCalledWith(key)
  expect(value)
    .toStrictEqual(await redis.get.mock.results[0].value)
})

describe('buffers', () => {
  it.each([
    ['object', { [generate()]: generate() }],
    ['array', [generate(), generate()]]
  ])('should encode %s', async (_, value) => {
    await aspect.invoke('store', key, value)

    const buffer = encode(value)

    expect(redis.set)
      .toHaveBeenCalledWith(key, buffer)
  })

  it('should pass arguments', async () => {
    const value = [1, 2]
    const buffer = encode(value)

    await aspect.invoke('store', key, value, 'EX', 1000)

    expect(redis.set)
      .toHaveBeenCalledWith(key, buffer, 'EX', 1000)
  })

  it.each([
    ['object', { [generate()]: generate() }],
    ['array', [generate(), generate()]]
  ])('should decode %s', async (_, value) => {
    const buffer = encode(value)

    redis.getBuffer.mockImplementationOnce(async () => buffer)

    const output = await aspect.invoke('fetch', key)

    expect(redis.getBuffer)
      .toHaveBeenCalledWith(key)
    expect(output)
      .toStrictEqual(value)
  })
})

it('should create DLM', async () => {
  expect(Redlock)
    .toHaveBeenCalledWith([redis], { retryCount: -1 })
})

it('should acquire lock', async () => {
  const keys = [generate(), generate()]
  const callback = jest.fn()

  await aspect.invoke('lock', keys, callback)

  expect(redlock.using)
    .toHaveBeenCalledWith(keys, 5000, callback)
})

it('should return result', async () => {
  const keys = [generate(), generate()]
  const callback = jest.fn()

  redlock.using.mockImplementationOnce(async () => generate())

  const result = await aspect.invoke('lock', keys, callback)

  expect(result)
    .toStrictEqual(await redlock.using.mock.results[0].value)
})

it('should handle non-array key', async () => {
  const key = generate()
  const callback = jest.fn()

  await aspect.invoke('lock', key, callback)

  expect(redlock.using)
    .toHaveBeenCalledWith([key], 5000, callback)
})
