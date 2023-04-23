'use strict'

const { generate } = require('randomstring')
const { Connector } = require('@toa.io/core')
const { sample } = require('@toa.io/generic')

const comq = require('./.test/mock.comq')
const mock = { comq }

jest.mock('comq', () => mock.comq)

const fixtures = require('./.test/aspect.fixtures')
const { create } = require('./aspect')

it('should be', async () => {
  expect(create).toBeInstanceOf(Function)
})

/** @type {toa.origins.amqp.Aspect} */
let aspect

/** @type {toa.origins.Manifest} */
let manifest

beforeEach(() => {
  jest.clearAllMocks()

  manifest = fixtures.manifest
  aspect = create(manifest)
})

it('should be instance of Connector', async () => {
  expect(aspect).toBeInstanceOf(Connector)
})

it('should expose name', async () => {
  expect(aspect.name).toStrictEqual('amqp')
})

it('should connect', async () => {
  await aspect.open()

  for (const reference of Object.values(manifest)) {
    expect(comq.connect).toHaveBeenCalledWith(reference)
  }
})

it('should disconnect', async () => {
  await aspect.open()
  await aspect.close()

  for (const reference of Object.values(manifest)) {
    const index = comq.connect.mock.calls.findIndex((call) => call[0] === reference)
    const io = await comq.connect.mock.results[index].value

    expect(io.close).toHaveBeenCalled()
  }
})

describe('invoke', () => {
  /** @type {jest.MockedObject<comq.IO>} */
  let io

  /** @type {string} */
  let origin

  let args

  beforeEach(async () => {
    await aspect.open()

    const origins = Object.keys(manifest)

    origin = sample(origins)

    const reference = manifest[origin]
    const index = comq.connect.mock.calls.findIndex((call) => call[0] === reference)

    io = await comq.connect.mock.results[index].value
    args = [generate(), generate(), generate()]
  })

  it('should be', async () => {
    expect(aspect.invoke).toBeInstanceOf(Function)
  })

  it.each(['emit', 'request'])('should %s', async (method) => {
    await aspect.invoke(origin, method, ...args)

    expect(io[method]).toHaveBeenCalledWith(...args)
  })

  it.each(['reply', 'consume', generate()])('should not expose %s',
    async (method) => {
      await expect(aspect.invoke(origin, method)).rejects.toThrow()
    })

  it('should throw if unknown origin', async () => {
    await expect(aspect.invoke(generate(), 'emit')).rejects.toThrow()
  })
})
