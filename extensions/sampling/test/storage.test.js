'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { SampleException, ReplayException } = require('../src/exceptions')

const fixtures = require('./storage.fixtures')
const { Factory } = require('../')
const { Storage } = require('../src/storage')

const { context } = require('../src/sample')

/** @type {toa.core.extensions.Factory} */
const factory = new Factory()

/** @type {toa.core.Storage} */
let storage

/** @type {toa.sampling.Request} */
let sample

it('should be', () => {
  expect(Storage).toBeDefined()
})

beforeEach(() => {
  jest.clearAllMocks()

  storage = factory.storage(fixtures.storage)
  sample = { storage: {} }
})

it('should be storage', () => {
  expect(storage).toBeDefined()
  expect(storage).toBeInstanceOf(Storage)
})

it('should depend on decorated storage', async () => {
  expect(storage).toBeInstanceOf(Connector)
  expect(fixtures.storage.link).toHaveBeenCalledWith(storage)
})

describe('get', () => {
  it('should call original if no sampling context', async () => {
    const query = { id: generate() }
    const output = await storage.get(query)

    expect(fixtures.storage.get).toHaveBeenCalledWith(query)
    expect(output).toStrictEqual(await fixtures.storage.get.mock.results[0].value)
  })

  it('should return sampled state', async () => {
    expect.assertions(2)

    sample.storage.current = { foo: generate() }

    await context.apply(sample, async () => {
      const output = await storage.get({})

      expect(output).toStrictEqual({
        id: expect.any(String), ...sample.storage.current
      })

      expect(fixtures.storage.get).not.toHaveBeenCalled()
    })
  })

  it('should throw if sample is array', async () => {
    expect.assertions(1)
    sample.storage.current = [{ foo: generate() }]

    await context.apply(sample, async () => {
      await expect(storage.get({})).rejects.toBeInstanceOf(SampleException)
    })
  })
})

describe('find', () => {
  it('should be', async () => {
    expect(storage.find).toBeDefined()
  })

  it('should call original if no sampling context', async () => {
    const query = { id: generate() }
    const output = await storage.find(query)

    expect(fixtures.storage.find).toHaveBeenCalledWith(query)
    expect(output).toStrictEqual(await fixtures.storage.find.mock.results[0].value)
  })

  it('should return sampled state', async () => {
    expect.assertions(2)

    sample.storage.current = [{ foo: generate() }]

    await context.apply(sample, async () => {
      const output = await storage.find({})
      const expected = []

      for (const current of sample.storage.current) {
        expected.push({ id: expect.any(String), ...current })
      }

      expect(output).toStrictEqual(expected)
      expect(fixtures.storage.find).not.toHaveBeenCalled()
    })
  })

  it('should throw if sample is not array', async () => {
    expect.assertions(1)
    sample.storage.current = { foo: generate() }

    await context.apply(sample, async () => {
      await expect(storage.find({})).rejects.toBeInstanceOf(SampleException)
    })
  })
})

describe('store', () => {
  it('should be', async () => {
    expect(storage.store).toBeDefined()
  })

  it('should call original if no sampling context', async () => {
    const object = { id: generate(), _version: 0 }
    const output = await storage.store(object)

    expect(fixtures.storage.store).toHaveBeenCalledWith(object)
    expect(output).toStrictEqual(await fixtures.storage.store.mock.results[0].value)
  })

  it('should throw if sample not matches', async () => {
    expect.assertions(1)

    sample.storage.next = { foo: generate() }

    const object = { id: generate(), _version: 0, bar: generate() }

    await context.apply(sample, async () => {
      await expect(storage.store(object)).rejects.toBeInstanceOf(ReplayException)
    })
  })

  it('should not throw if sample matches', async () => {
    expect.assertions(1)

    sample.storage.next = { foo: generate() }

    const object = { id: generate(), _version: 0, ...sample.storage.next }

    await context.apply(sample, async () => {
      await expect(storage.store(object)).resolves.not.toBeInstanceOf(ReplayException)
    })
  })
})

describe('upsert', () => {
  it('should be', async () => {
    expect(storage.upsert).toBeDefined()
  })

  it('should call original', async () => {
    const query = { id: generate() }
    const changeset = { foo: generate() }
    const insert = { id: generate(), _version: 0 }

    const output = await storage.upsert(query, changeset, insert)

    expect(fixtures.storage.upsert).toHaveBeenCalledWith(query, changeset, insert)
    expect(output).toStrictEqual(await fixtures.storage.upsert.mock.results[0].value)
  })
})
