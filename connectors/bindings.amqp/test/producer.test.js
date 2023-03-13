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
