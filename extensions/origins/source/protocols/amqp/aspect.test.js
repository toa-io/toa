'use strict'

const { Connector } = require('@toa.io/core')

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
    expect(comq.assert).toHaveBeenCalledWith(...reference)
  }
})
