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

/** @type {toa.messenger.Channel} */
let channel

beforeEach(async () => {
  jest.clearAllMocks()

  conn = await amqplib.connect()
  chan = await conn.createChannel()
  channel = new Channel(chan)
})

describe('consume', () => {
  const consumer = /** @type {toa.messenger.consumer} */ jest.fn(async () => generate())
  const queue = generate()
  const durable = flip()

  beforeEach(async () => {
    await channel.consume(queue, durable, consumer)
  })

  it('should assert queue', async () => {
    expect(chan.assertQueue).toHaveBeenCalledWith(queue, { durable })
  })

  it('should bind consumer', async () => {
    expect(chan.consume).toHaveBeenCalledWith(queue, consumer)
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
    expect(chan.assertQueue).toHaveBeenCalledWith(queue, { durable: true })
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
    expect(chan.sendToQueue).toHaveBeenCalledWith(queue, buffer, properties)
  })
})

describe('send', () => {
  const queue = generate()
  const buffer = randomBytes(10)
  const properties = { replyTo: generate() }

  it('should send to queue', async () => {
    await channel.send(queue, buffer, properties)

    expect(chan.sendToQueue).toHaveBeenCalledWith(queue, buffer, properties)
  })
})
