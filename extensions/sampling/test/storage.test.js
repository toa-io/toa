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

/** @type {toa.sampling.request.Sample} */
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

describe.each(['get', 'find'])('%s', (method) => {
  const array = method === 'find'

  it('should be', async () => {
    expect(storage[method]).toBeDefined()
  })

  it('should call original storage if no sampling context', async () => {
    const query = { id: generate() }
    const output = await storage[method](query)

    expect(fixtures.storage[method]).toHaveBeenCalledWith(query)
    expect(output).toStrictEqual(await fixtures.storage[method].mock.results[0].value)
  })

  it('should return sampled state', async () => {
    expect.assertions(2)

    const query = {}
    const object = { foo: generate() }

    sample.storage.current = array ? [object] : object

    await context.apply(sample, async () => {
      const output = await storage[method](query)

      expect(output).toMatchObject(sample.storage.current)

      expect(fixtures.storage[method]).not.toHaveBeenCalled()
    })
  })

  it(`should throw if sample is${array ? ' not' : ''} array`, async () => {
    expect.assertions(1)

    const query = {}
    const object = { foo: generate() }

    sample.storage.current = array ? object : [object]

    await context.apply(sample, async () => {
      await expect(storage[method](query)).rejects.toBeInstanceOf(SampleException)
    })
  })

  it('should throw if sample is autonomous and not current state sample given', async () => {
    const query = {}

    sample.autonomous = true

    await context.apply(sample, async () => {
      await expect(storage[method](query)).rejects.toBeInstanceOf(SampleException)
    })
  })
})

describe('store', () => {
  it('should be', async () => {
    expect(storage.store).toBeDefined()
  })

  it('should call original storage if no sampling context', async () => {
    const object = { id: generate(), _version: 0 }
    const output = await storage.store(object)

    expect(fixtures.storage.store).toHaveBeenCalledWith(object)
    expect(output).toStrictEqual(await fixtures.storage.store.mock.results[0].value)
  })

  it('should call original storage if no next state', async () => {
    const object = { id: generate(), _version: 0 }

    await context.apply(sample, async () => {
      await storage.store(object)
      expect(fixtures.storage.store).toHaveBeenCalledWith(object)
    })
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

  it('should if sample is autonomous and no next state given', async () => {
    sample.autonomous = true
    sample.storage = { current: { foo: generate() } }

    const object = { id: generate(), _version: 0 }

    await context.apply(sample, async () => {
      await expect(storage.store(object)).rejects.toBeInstanceOf(SampleException)
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
