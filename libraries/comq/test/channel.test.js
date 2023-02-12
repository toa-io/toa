'use strict'

// region setup

const { randomBytes } = require('node:crypto')
const { generate } = require('randomstring')
const { flip, promise } = require('@toa.io/libraries/generic')

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

// endregion

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

    expect(chan.assertQueue).toHaveBeenCalledWith(queue, { expires: 3600 * 1000 })
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
    const call = chan.sendToQueue.mock.calls[0]

    expect(call[0]).toStrictEqual(queue)
    expect(call[1]).toStrictEqual(buffer)
    expect(call[2]).toMatchObject(properties)
  })

  it('should throw if no properties provided', async () => {
    await expect(channel.deliver(queue, buffer)).resolves.not.toThrow()
  })

  it('should await confirmation', async () => {
    const callback = chan.sendToQueue.mock.calls[0][3]

    expect(callback).toBeInstanceOf(Function)
  })
})

describe('send', () => {
  const queue = generate()
  const buffer = randomBytes(10)
  const properties = { replyTo: generate() }

  it('should send persistent message', async () => {
    await channel.send(queue, buffer, properties)

    const call = chan.sendToQueue.mock.calls[0]

    expect(call[0]).toStrictEqual(queue)
    expect(call[1]).toStrictEqual(buffer)
    expect(call[2]).toMatchObject({ persistent: true, ...properties })
  })

  it('should throw if no properties provided', async () => {
    await expect(channel.send(queue, buffer)).resolves.not.toThrow()
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

describe('publish', () => {
  const exchange = generate()
  const buffer = randomBytes(8)

  it('should be', async () => {
    expect(channel.publish).toBeDefined()
  })

  beforeEach(async () => {
    await channel.publish(exchange, buffer)
  })

  it('should assert durable fanout exchange', async () => {
    expect(chan.assertExchange).toHaveBeenCalledTimes(1)

    const [name, type, options] = chan.assertExchange.mock.calls[0]

    expect(name).toStrictEqual(exchange)
    expect(type).toStrictEqual('fanout')

    if (options !== undefined) expect(options).not.toMatchObject({ durable: false })
  })

  it('should publish persistent message', async () => {
    expect(chan.publish).toHaveBeenCalledTimes(1)

    const call = chan.publish.mock.calls[0]

    expect(call[0]).toStrictEqual(exchange)
    expect(call[1]).toStrictEqual('')
    expect(call[2]).toStrictEqual(buffer)
    expect(call[3]).toMatchObject({ persistent: true })
  })
})

describe('close', () => {
  it('should close channel', async () => {
    await channel.close()

    expect(chan.close).toHaveBeenCalled()
  })

  it('should wait for event processing to be completed', async () => {
    expect.assertions(2)

    const queue = generate()
    const persistent = flip()
    const processing = promise()
    const consumer = jest.fn(() => processing)

    await channel.consume(queue, persistent, consumer)

    const callback = chan.consume.mock.calls[0][1]
    const content = randomBytes(8)
    const message = /** @type {import('amqplib').ConsumeMessage} */ { content }

    setImmediate(async () => {
      setImmediate(() => {
        expect(chan.close).not.toHaveBeenCalled()

        processing.resolve()
      })

      await channel.close()

      expect(chan.close).toHaveBeenCalled()
    })

    await callback(message)
  })
})

describe('back pressure', () => {
  const exchange = generate()
  const queue = generate()
  const buffer = randomBytes(8)

  it('should apply back pressure', async () => {
    expect.assertions(3)

    // noinspection JSCheckFunctionSignatures
    chan.publish.mockImplementationOnce((_0, _1, _2, _3, resolve) => {
      resolve(null)

      return false
    })

    await channel.publish(exchange, buffer)

    expect(chan.publish).toHaveBeenCalled()

    setImmediate(() => {
      expect(chan.sendToQueue).not.toHaveBeenCalled()

      chan.emit('drain')
    })

    await channel.send(queue, buffer)

    expect(chan.sendToQueue).toHaveBeenCalled()
  })
})
