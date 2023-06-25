import { generate } from 'randomstring'
import type * as redis from 'ioredis'

export const Redis = jest.fn(() => ({
  connect: jest.fn(async () => undefined),
  disconnect: jest.fn(),
  get: jest.fn(async () => generate()),
  getBuffer: jest.fn(async () => Buffer.from(generate())),
  set: jest.fn(async () => undefined),
  on: jest.fn()
})) as unknown as jest.Mock<typeof redis.Cluster>

export const Connection = jest.fn(() => ({
  redis: new Redis(),
  link: jest.fn()
}))

export const ioredis = { Redis }