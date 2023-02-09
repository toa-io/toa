'use strict'

const { randomBytes } = require('node:crypto')
const { generate } = require('randomstring')
const { flip } = require('@toa.io/libraries/generic')

const { Channel } = require('../src/channel')
const { amqplib } = require('./amqplib.mock')

it('should be', async () => {
  expect(Channel).toBeDefined()
})

let conn

/** @type {jest.MockedObject<import('amqplib').Channel>} */
let chan

/** @type {comq.Channel} */
let channel

beforeEach(async () => {
  jest.clearAllMocks()

  conn = await amqplib.connect()
  chan = await conn.createChannel()
  channel = new Channel(chan)
})

describe('consume', () => {
  const consumer = /** @type {comq.channel.consumer} */ jest.fn(async () => undefined)
  const queue = generate()
  const persistent = flip()

  beforeEach(async () => {
    await channel.consume(queue, persistent, consumer)
  })

  it('should assert persistent queue', async () => {
    const queue = generate()
    const persistent = true

    await channel.consume(queue, persistent, consumer)

    expect(chan.assertQueue).toHaveBeenCalledTimes(2)

    const [name, options] = chan.assertQueue.mock.calls[1]

    expect(name).toStrictEqual(queue)

    if (options !== undefined) {
      expect(options.durable).not.toStrictEqual(false)
      expect(options.arguments?.['x-expires']).toBeUndefined()
    }
  })

  it('should assert transient queue', async () => {
    const queue = generate()
    const persistent = false

    await channel.consume(queue, persistent, consumer)

    expect(chan.assertQueue).toHaveBeenCalledWith(queue, { arguments: { 'x-expires': 3600 * 1000 } })
  })

  it('should start consuming', async () => {
    expect(chan.consume).toHaveBeenCalledWith(queue, expect.any(Function))

    const content = randomBytes(8)
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content }
    const callback = chan.consume.mock.calls[0][1]

    await callback(message)

    expect(consumer).toHaveBeenCalledWith(message)
  })

  it('should ack message', async () => {
    const consumer = chan.consume.mock.calls[0][1]

    expect(typeof consumer).toStrictEqual('function')

    const content = randomBytes(8)
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content }

    await consumer(message)

    expect(chan.ack).toHaveBeenCalledWith(message)
  })
})

describe.each(['deliver', 'send'])('%s', () => {
  const queue = generate()
  const buffer = randomBytes(10)
  const properties = { replyTo: generate() }

  beforeEach(async () => {
    await channel.deliver(queue, buffer, properties)
  })

  it('should assert durable queue', async () => {
    expect(chan.assertQueue).toHaveBeenCalledWith(queue, expect.not.objectContaining({ durable: false }))
  })

  it('should assert queue once', async () => {
    await channel.deliver(queue, buffer, properties)

    expect(chan.assertQueue).toHaveBeenCalledTimes(1)
  })

  it('should assert queue once concurrently', async () => {
    jest.clearAllMocks()

    expect(chan.assertQueue).toHaveBeenCalledTimes(0)

    const queue = generate()
    const deliver = () => channel.deliver(queue, buffer, properties)

    await Promise.all([deliver(), deliver()])

    expect(chan.assertQueue).toHaveBeenCalledTimes(1)
  })

  it('should send to queue', async () => {
    expect(chan.sendToQueue).toHaveBeenCalledWith(queue, buffer, expect.objectContaining(properties))
  })
})

describe('send', () => {
  const queue = generate()
  const buffer = randomBytes(10)
  const properties = { replyTo: generate() }

  it('should send persistent message', async () => {
    await channel.send(queue, buffer, properties)

    expect(chan.sendToQueue).toHaveBeenCalledWith(queue, buffer, {
      ...properties,
      persistent: true
    })
  })
})

describe('subscribe', () => {
  const exchange = generate()
  const queue = generate()
  const consumer = /** @type {comq.channel.consumer} */ jest.fn(() => undefined)

  beforeEach(async () => {
    jest.clearAllMocks()

    await channel.subscribe(exchange, queue, consumer)
  })

  it('should assert durable fanout exchange', async () => {
    expect(chan.assertExchange).toHaveBeenCalledTimes(1)

    const [name, type, options] = chan.assertExchange.mock.calls[0]

    expect(name).toStrictEqual(exchange)
    expect(type).toStrictEqual('fanout')

    if (options !== undefined) expect(options).not.toMatchObject({ durable: false })
  })

  it('should assert durable queue', async () => {
    expect(chan.assertQueue).toHaveBeenCalledWith(queue, expect.not.objectContaining({ durable: false }))
  })

  it('should bind queue to exchange', async () => {
    expect(chan.bindQueue).toHaveBeenCalledTimes(1)
    expect(chan.bindQueue).toHaveBeenCalledWith(queue, exchange, '')
  })

  it('should start consuming', async () => {
    expect(chan.consume).toHaveBeenCalledTimes(1)
    expect(chan.consume).toHaveBeenCalledWith(queue, expect.any(Function))

    const consume = chan.consume.mock.calls[0][1]
    const message = generate()

    await consume(message)

    expect(consumer).toHaveBeenCalledWith(message)
    expect(chan.ack).toHaveBeenCalledWith(message)
  })
})

describe('close', () => {
  it('should close channel', async () => {
    await channel.close()

    expect(chan.close).toHaveBeenCalled()
  })
})
