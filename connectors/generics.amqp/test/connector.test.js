'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { /** @type {jest.MockedClass<Pointer>} */ Pointer } = require('@toa.io/pointer')

jest.mock('../source/communication')
jest.mock('@toa.io/pointer')

const {
  /** @type {jest.MockedClass<Communication>} */
  Communication
} = require('../source/communication')

const { connector } = require('../')

it('should be', async () => {
  expect(connector).toBeInstanceOf(Function)
})

/** @type {toa.core.Locator} */
let locator

/** @type {toa.amqp.Communication} */
let comm

const prefix = generate()

beforeEach(() => {
  jest.clearAllMocks()

  const namespace = generate()
  const name = generate()

  Pointer.mockImplementation(() => ({ reference: generate() }))

  locator = new Locator(name, namespace)
  comm = connector(prefix, locator)
})

it('should create Pointer', async () => {
  expect(Pointer).toHaveBeenCalledWith(prefix, locator, { protocol: 'amqp:' })
})

it('should return Communication', async () => {
  const pointer = Pointer.mock.results[0].value

  expect(Communication).toHaveBeenCalledWith(pointer.reference)
  expect(comm).toStrictEqual(Communication.mock.instances[0])
})
