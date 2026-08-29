'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const mock = {
  context: { resolveURIs: jest.fn(() => references) },
  sources: { resolveURIs: jest.fn(() => references) },
  communication: {
    Communication: jest.fn(function (references, evict) {
      this.references = references
      this.evict = evict
      this.sealed = false
      this.link = jest.fn()
    })
  }
}

jest.mock('../source/deployment/context', () => mock.context)
jest.mock('../source/deployment/sources', () => mock.sources)
jest.mock('../source/communication', () => mock.communication)

const { Communication } = mock.communication
const { Factory } = require('../source/factory')

/** @type {string[]} */
let references

/** @type {Factory} */
let factory

const component = /** @type {jest.MockedObject<toa.core.Component>} */ {
  link: jest.fn(), invoke: jest.fn()
}

const receiver = /** @type {jest.MockedObject<toa.core.Receiver>} */ {
  link: jest.fn(), receive: jest.fn()
}

beforeEach(() => {
  jest.clearAllMocks()

  references = ['amqp://broker']
  factory = new Factory()
})

/** How many communications the factory has made — one apiece means they are shared. */
const made = () => Communication.mock.instances.length

/** The communication made by the n-th construction. */
const made_ = (n) => Communication.mock.instances[n]

const locator = (id = 'default.' + generate(8).toLowerCase()) => {
  const [namespace, name] = id.split('.')

  return new Locator(name, namespace)
}

describe('sharing', () => {
  it('should give a component one communication', () => {
    const one = locator()

    factory.producer(one, ['create'], component)
    factory.producer(one, ['observe'], component)

    expect(made()).toStrictEqual(1)
  })

  it('should give different components different communications', () => {
    factory.producer(locator(), ['create'], component)
    factory.producer(locator(), ['create'], component)

    expect(made()).toStrictEqual(2)
  })

  it('should give a component the same one for its emitter', () => {
    const one = locator()

    factory.producer(one, ['create'], component)
    factory.emitter(one, 'created')

    expect(made()).toStrictEqual(1)
  })

  it('should pool the connectors that only publish', () => {
    factory.consumer(locator(), 'create')
    factory.consumer(locator(), 'observe')

    expect(made()).toStrictEqual(1)
  })

  it('should keep the pooled ones apart from a component', () => {
    const one = locator()

    factory.producer(one, ['create'], component)
    factory.consumer(one, 'create')

    expect(made()).toStrictEqual(2)
  })

  it('should tell one set of brokers from another', () => {
    const one = locator()

    factory.producer(one, ['create'], component)

    references = ['amqp://elsewhere']

    factory.producer(one, ['create'], component)

    expect(made()).toStrictEqual(2)
  })
})

describe('receivers', () => {
  // the locator names the component the events come from, `group` the one consuming them,
  // and it is the consuming one whose teardown the sealing precedes
  it('should hold a receiver with the component that consumes', () => {
    const consuming = locator()

    factory.producer(consuming, ['create'], component)
    factory.receiver(locator(), 'created', consuming.id, receiver)

    expect(made()).toStrictEqual(1)
  })

  it('should keep two consumers of one source apart', () => {
    const source = locator()

    factory.receiver(source, 'created', locator().id, receiver)
    factory.receiver(source, 'created', locator().id, receiver)

    expect(made()).toStrictEqual(2)
  })

  // an exclusive queue is remembered by its exchange alone, so two subscriptions on one
  // communication would share it and the broker would give each event to only one
  it('should give a receiver with no group one of its own', () => {
    const source = locator()

    factory.receiver(source, 'created', undefined, receiver)
    factory.receiver(source, 'created', undefined, receiver)

    expect(made()).toStrictEqual(2)
  })

  it('should resolve a foreign source by its own annotation', () => {
    const source = new Locator(generate(8).toLowerCase())

    factory.receiver(source, 'created', generate(), receiver)

    expect(mock.sources.resolveURIs).toHaveBeenCalledWith(source)
    expect(mock.context.resolveURIs).not.toHaveBeenCalled()
  })

  it('should resolve a source of the context by the context', () => {
    const source = locator()

    factory.receiver(source, 'created', generate(), receiver)

    expect(mock.context.resolveURIs).toHaveBeenCalledWith(source)
    expect(mock.sources.resolveURIs).not.toHaveBeenCalled()
  })
})

describe('broadcasts', () => {
  it('should hold the broadcasts of one group together', () => {
    const group = generate()

    factory.broadcast('discovery', group)
    factory.broadcast('discovery', group)

    expect(made()).toStrictEqual(1)
  })

  it('should give a broadcast with no group one of its own', () => {
    factory.broadcast('discovery')
    factory.broadcast('discovery')

    expect(made()).toStrictEqual(2)
  })
})

describe('eviction', () => {
  it('should not hand out one that has said it is going', () => {
    const one = locator()

    factory.producer(one, ['create'], component)

    made_(0).evict()

    factory.producer(one, ['create'], component)

    expect(made()).toStrictEqual(2)
  })

  it('should not hand out one that is sealed', () => {
    const one = locator()

    factory.producer(one, ['create'], component)

    made_(0).sealed = true

    factory.producer(one, ['create'], component)

    expect(made()).toStrictEqual(2)
  })

  it('should not evict the one that replaced it', () => {
    const one = locator()

    factory.producer(one, ['create'], component)

    const first = made_(0)

    first.evict()

    factory.producer(one, ['create'], component)

    // the one that has gone says so again when it is disposed of
    first.evict()

    factory.producer(one, ['create'], component)

    expect(made()).toStrictEqual(2)
  })
})
