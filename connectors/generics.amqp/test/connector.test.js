'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')
const { random } = require('@toa.io/generic')

jest.mock('../source/communication')
jest.mock('@toa.io/pointer')

const {
  /** @type {jest.MockedClass<Pointer>} */
  Pointer
} = require('@toa.io/pointer')

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

it('should create Communication', async () => {
  const pointer = Pointer.mock.results[0].value

  expect(Communication).toHaveBeenCalledWith([pointer.reference])
})

it('should return Communication', async () => {
  expect(comm).toStrictEqual(Communication.mock.instances[0])
})

it('should parse ranges', async () => {
  jest.clearAllMocks()

  const base = generate()
  const shardsCount = random(5) + 1

  Pointer.mockImplementation(() => ({ reference: `{0-${shardsCount - 1}}.${base}` }))

  const expected = Array.from({ length: shardsCount }, (_, i) => `${i}.${base}`)

  comm = connector(prefix, locator)

  expect(Communication).toHaveBeenCalledWith(expected)
})

it('should parse env variables', async () => {
  jest.clearAllMocks()

  const base = generate()
  const varName = generate({ charset: 'abcDerWsxzF', length: 6 })
  const varValue = generate()

  process.env[varName] = varValue

  const reference = `\${${varName}}.${base}`

  Pointer.mockImplementation(() => ({ reference }))

  const expected = `${varValue}.${base}`

  comm = connector(prefix, locator)

  expect(Communication).toHaveBeenCalledWith([expected])
})
