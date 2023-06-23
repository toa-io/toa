import { encode } from 'msgpackr'
import { generate } from 'randomstring'
import { Aspect } from './Aspect'
import * as mock from './Connection.fixtures'
import type { Connection } from './Connection'
import type { Cluster } from 'ioredis'

let aspect: Aspect
let connection: jest.MockedObject<Connection>
let cluster: jest.MockedObject<Cluster>

const key = generate()

beforeEach(() => {
  connection = new mock.Connection() as unknown as jest.MockedObject<Connection>
  cluster = connection.redis as unknown as jest.MockedObject<Cluster>
  aspect = new Aspect(connection)
})

it('should depend on Connection', async () => {
  expect(connection.link).toHaveBeenCalledWith(aspect)
})

it('should set', async () => {
  const value = generate()

  await aspect.invoke('set', key, value)

  expect(cluster.set).toHaveBeenCalledWith(key, value)
})

it('should get', async () => {
  const value = await aspect.invoke('get', key)

  expect(cluster.get).toHaveBeenCalledWith(key)
  expect(value).toStrictEqual(await cluster.get.mock.results[0].value)
})

describe('buffers', () => {
  it.each([
    ['object', { [generate()]: generate() }],
    ['array', [generate(), generate()]]
  ])('should encode %s', async (_, value) => {
    await aspect.invoke('store', key, value)

    const buffer = encode(value)

    expect(cluster.set).toHaveBeenCalledWith(key, buffer)
  })

  it('should pass arguments', async () => {
    const value = [1, 2]
    const buffer = encode(value)

    await aspect.invoke('store', key, value, 'EX', 1000)

    expect(cluster.set).toHaveBeenCalledWith(key, buffer, 'EX', 1000)
  })

  it.each([
    ['object', { [generate()]: generate() }],
    ['array', [generate(), generate()]]
  ])('should decode %s', async (_, value) => {
    const buffer = encode(value)

    cluster.getBuffer.mockImplementationOnce(async () => buffer)

    const output = await aspect.invoke('fetch', key)

    expect(cluster.getBuffer).toHaveBeenCalledWith(key)
    expect(output).toStrictEqual(value)
  })
})
