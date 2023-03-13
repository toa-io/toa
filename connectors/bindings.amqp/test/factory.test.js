'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

jest.mock('../source/pointer')
jest.mock('../source/communication')
jest.mock('../source/producer')

const {
  /** @type {jest.MockedClass<Communication>} */
  Communication
} = require('../source/communication')

const {
  /** @type {jest.MockedClass<Pointer>} */
  Pointer
} = require('../source/pointer')

const {
  /** @type {jest.MockedClass<Producer>} */
  Producer
} = require('../source/producer')

const { Factory } = require('../')

it('should be', async () => {
  expect(Factory).toBeDefined()
})

/** @type {toa.core.bindings.Factory} */
let factory

beforeEach(() => {
  factory = new Factory()
})

describe('Producer', () => {
  it('should be', async () => {
    expect(factory.producer).toBeDefined()
  })

  /** @type {toa.core.Locator} */
  let locator

  const endpoints = [generate(), generate()]

  const component = /** @type {toa.core.Component} */ {}

  /** @type {toa.core.Connector} */
  let connector

  beforeEach(() => {
    jest.clearAllMocks()

    const name = generate()
    const namespace = generate()

    locator = new Locator(name, namespace)
    connector = factory.producer(locator, endpoints, component)
  })

  it('should create Pointer', async () => {
    expect(Pointer).toHaveBeenCalledWith(locator)
  })

  it('should create Communication', async () => {
    const pointer = Pointer.mock.instances[0]

    expect(Communication).toHaveBeenCalledWith(pointer)
  })

  it('should create Producer', async () => {
    const communication = Communication.mock.instances[0]

    expect(Producer).toHaveBeenCalledWith(communication, locator, endpoints, component)
    expect(connector).toBeInstanceOf(Producer)
  })
})
