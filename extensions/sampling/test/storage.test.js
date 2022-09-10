'use strict'

const { generate } = require('randomstring')
const { context } = require('@toa.io/libraries/generic')
const { SampleException } = require('../src/exceptions')

const fixtures = require('./storage.fixtures')
const { Factory } = require('../')
const { Storage } = require('../src/storage')

/** @type {toa.core.extensions.Factory} */
const factory = new Factory()

/** @type {toa.core.Storage} */
let storage

/** @type {toa.sampling.Sample} */
let sample

const ctx = context('sampling')

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

    await ctx.apply(sample, async () => {
      const output = await storage.get({})

      expect(output).toStrictEqual(sample.storage.current)
      expect(fixtures.storage.get).not.toHaveBeenCalled()
    })
  })

  it('should throw if sample is array', async () => {
    expect.assertions(1)
    sample.storage.current = [{ foo: generate() }]

    await ctx.apply(sample, async () => {
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

    await ctx.apply(sample, async () => {
      const output = await storage.find({})

      expect(output).toStrictEqual(sample.storage.current)
      expect(fixtures.storage.find).not.toHaveBeenCalled()
    })
  })

  it('should throw if sample is not array', async () => {
    expect.assertions(1)
    sample.storage.current = { foo: generate() }

    await ctx.apply(sample, async () => {
      await expect(storage.find({})).rejects.toBeInstanceOf(SampleException)
    })
  })
})
