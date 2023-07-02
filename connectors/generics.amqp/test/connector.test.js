'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

jest.mock('../source/communication')
jest.mock('@toa.io/pointer')

const {
  /** @type {jest.MockedFn} */
  resolve
} = require('@toa.io/pointer')

const {
  /** @type {jest.MockedClass<Communication>} */
  Communication
} = require('../source/communication')

const { connector } = require('../')

it('should be', async () => {
  expect(connector).toBeInstanceOf(Function)
})

let locator

/** @type {toa.amqp.Communication} */
let comm

const prefix = generate()

beforeEach(() => {
  jest.clearAllMocks()

  const namespace = generate()
  const name = generate()

  resolve.mockImplementation(() => ({ [generate()]: generate() }))

  locator = new Locator(name, namespace)
  comm = connector(prefix, locator)
})

it('should create Pointer', async () => {
  expect(resolve).toHaveBeenCalledWith(prefix, locator.id)
})

it('should create Communication', async () => {
  const urls = resolve.mock.results[0].value

  expect(Communication).toHaveBeenCalledWith(urls)
})

it('should return Communication', async () => {
  expect(comm).toStrictEqual(Communication.mock.instances[0])
})
