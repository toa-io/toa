'use strict'

const { generate } = require('randomstring')
const { each } = require('@toa.io/generic')

const mock = {
  communication: require('./communication.mock').communication,
  queues: require('./queues.mock')
}

jest.mock('../source/queues', () => mock.queues)

const { Producer } = require('../source/producer')

it('should be', async () => {
  expect(Producer).toBeDefined()
})

/** @type {jest.MockedObject<toa.amqp.Communication>} */
let comm

const locator = /** @type {toa.core.Locator} */ generate()
const endpoints = [generate(), generate()]

const component = /** @type {jest.MockedObject<toa.core.Component>} */ {
  connect: jest.fn(async () => undefined),
  disconnect: jest.fn(async () => undefined),
  link: jest.fn(),
  invoke: jest.fn(async () => generate())
}

/** @type {Producer} */
let producer

beforeEach(() => {
  jest.clearAllMocks()

  comm = mock.communication()
  producer = new Producer(comm, locator, endpoints, component)
})

it('should depend on Communication', async () => {
  expect(comm.link).toHaveBeenCalled()
})

it('should depend onComponent', async () => {
  expect(component.link).toHaveBeenCalled()
})

it('should bind endpoints', async () => {
  await producer.connect()

  await each(endpoints, async (endpoint, i) => {
    const n = i + 1

    expect(mock.queues.name).toHaveBeenNthCalledWith(n, locator, endpoint)

    const queue = mock.queues.name.mock.results[i].value

    expect(comm.reply).toHaveBeenNthCalledWith(n, queue, expect.any(Function))

    const process = comm.reply.mock.calls[i][1]

    const request = generate()

    await process(request)

    expect(component.invoke).toHaveBeenNthCalledWith(n, endpoint, request)
  })
})

it('should bind the tasks queue', async () => {
  await producer.connect()

  await each(endpoints, async (endpoint, i) => {
    const queue = mock.queues.name.mock.results[i].value

    expect(comm.process).toHaveBeenNthCalledWith(i + 1, queue + '..tasks', expect.any(Function))

    const process = comm.process.mock.calls[i][1]
    const request = generate()

    await process(request)

    expect(component.invoke).toHaveBeenCalledWith(endpoint, request)
  })
})

describe('closing', () => {
  it('should stop consuming', async () => {
    await producer.connect()
    await producer.disconnect()

    expect(comm.seal).toHaveBeenCalled()
  })

  // sealing cancels the consumer but does not recall what has already been dispatched,
  // and the component is torn down as soon as this connector is closed
  it('should wait for invocations still running', async () => {
    let complete
    let closed = false

    component.invoke.mockImplementationOnce(async () =>
      await new Promise((resolve) => { complete = resolve }))

    await producer.connect()

    const process = comm.reply.mock.calls[0][1]
    const invocation = process(generate())
    const closing = producer.disconnect().then(() => { closed = true })

    await sleep()

    expect(closed).toBe(false)

    complete(generate())

    await invocation
    await closing

    expect(closed).toBe(true)
  })

  it('should not be held by an invocation that failed', async () => {
    component.invoke.mockImplementationOnce(async () => { throw new Error('nope') })

    await producer.connect()

    const process = comm.reply.mock.calls[0][1]

    await expect(process(generate())).rejects.toThrow('nope')
    await expect(producer.disconnect()).resolves.not.toThrow()
  })
})

const sleep = async () => await new Promise((resolve) => setImmediate(resolve))
