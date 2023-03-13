'use strict'

// region setup

const { generate } = require('randomstring')

jest.mock('../source/pointer')
jest.mock('../source/communication')
jest.mock('../source/producer')
jest.mock('../source/consumer')
jest.mock('../source/emitter')

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

const {
  /** @type {jest.MockedClass<Consumer>} */
  Consumer
} = require('../source/consumer')

const {
  /** @type {jest.MockedClass<Emitter>} */
  Emitter
} = require('../source/emitter')

const { Factory } = require('../')

// endregion

it('should be', async () => {
  expect(Factory).toBeDefined()
})

/** @type {toa.core.bindings.Factory} */
let factory

beforeEach(() => {
  jest.clearAllMocks()

  factory = new Factory()
})

const locator = /** @type {toa.core.Locator} */ { name: generate(), namespace: generate() }
const endpoints = [generate(), generate()]
const endpoint = generate()
const component = /** @type {toa.core.Component} */ {}

/** @type {jest.MockedObject<toa.amqp.Communication>} */
let comm

/** @type {toa.core.Connector} */
let producer

/** @type {toa.core.bindings.Consumer} */
let consumer

/** @type {toa.core.bindings.Emitter} */
let emitter

describe.each(['Producer', 'Consumer', 'Emitter'])('%s assets', (classname) => {
  const method = classname.toLowerCase()

  it('should be', async () => {
    expect(factory[method]).toBeDefined()
  })

  beforeEach(() => {
    jest.clearAllMocks()

    switch (method) {
      case 'producer':
        factory.producer(locator, endpoints, component)
        break
      case 'consumer':
        factory.consumer(locator, endpoint)
        break
      case 'emitter':
        factory.emitter(locator, endpoint)
        break
    }
  })

  it('should create Pointer', async () => {
    expect(Pointer).toHaveBeenCalledWith(locator)
  })

  it('should create Communication', async () => {
    const pointer = Pointer.mock.instances[0]

    expect(Communication).toHaveBeenCalledWith(pointer)
  })
})

describe('Producer', () => {
  beforeEach(() => {
    producer = factory.producer(locator, endpoints, component)
    comm = Communication.mock.instances[0]
  })

  it('should create instance', async () => {
    expect(Producer).toHaveBeenCalledWith(comm, locator, endpoints, component)
    expect(producer).toStrictEqual(Producer.mock.instances[0])
  })
})

describe('Consumer', () => {
  beforeEach(() => {
    consumer = factory.consumer(locator, endpoint)
    comm = Communication.mock.instances[0]
  })

  it('should create instance', async () => {
    expect(Consumer).toHaveBeenCalledWith(comm, locator, endpoint)
    expect(consumer).toStrictEqual(Consumer.mock.instances[0])
  })
})

describe('Emitter', () => {
  beforeEach(() => {
    emitter = factory.emitter(locator, endpoint)
    comm = Communication.mock.instances[0]
  })

  it('should create instance', async () => {
    expect(Emitter).toHaveBeenCalledWith(comm, locator, endpoint)
    expect(emitter).toStrictEqual(Emitter.mock.instances[0])
  })
})
