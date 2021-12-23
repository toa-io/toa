'use strict'

const { Connector } = require('@toa.io/core')
const { console, newid } = require('@toa.io/gears')

const { pack, unpack } = require('./message')

class Channel extends Connector {
  #id
  #connection
  #channel

  #bound = {}
  #expected = {}

  constructor (connection) {
    super()

    this.#id = newid()
    this.#connection = connection

    this.depends(connection)
  }

  async connection () {
    this.#channel = await this.#connection.channel()
  }

  async request (label, request) {
    const queue = 'request.' + label
    const correlation = newid()

    await this.#channel.assertQueue(queue, QUEUE)
    await this.#bind(label)

    const message = pack(request)
    const properties = { replyTo: this.#id, correlationId: correlation }

    await this.#channel.sendToQueue(queue, message, properties)

    const reply = await this.#reply(label, correlation)

    return unpack(reply.content)
  }

  async reply (label, invocation) {
    const queue = 'request.' + label
    const exchange = 'reply.' + label

    await this.#channel.assertQueue(queue, QUEUE)
    await this.#channel.assertExchange(exchange, 'direct', EXCHANGE)

    await this.#channel.consume(queue, async (received) => {
      const content = unpack(received.content)
      const reply = await invocation(content)

      const message = pack(reply)
      const properties = { correlationId: received.properties.correlationId }

      await this.#channel.publish(exchange, received.properties.replyTo, message, properties)
      await this.#channel.ack(received)
    })
  }

  async publish (label, payload, options) {
    const exchange = 'event.' + label

    await this.#channel.assertExchange(exchange, 'fanout', EXCHANGE)

    const message = pack(payload)

    await this.#channel.publish(exchange, '', message, options)
  }

  async subscribe (label, id, callback) {
    const exchange = 'event.' + label
    const queue = exchange + '..' + id

    await this.#channel.assertExchange(exchange, 'fanout', EXCHANGE)
    await this.#channel.assertQueue(queue, QUEUE)
    await this.#channel.bindQueue(queue, exchange, '')

    await this.#channel.consume(queue, async (received) => {
      const content = unpack(received.content)
      await callback(content)
      await this.#channel.ack(received)
    })
  }

  async #bind (label) {
    const queue = `reply.${label}.${this.#id}`
    const exchange = 'reply.' + label

    if (this.#bound[queue]) return

    await this.#channel.assertQueue(queue, { exclusive: true, ...QUEUE })
    await this.#channel.assertExchange(exchange, 'direct', EXCHANGE)
    await this.#channel.bindQueue(queue, exchange, this.#id)
    await this.#channel.consume(queue, (message) => this.#replies(message))

    this.#bound[queue] = true
  }

  #reply (label, correlation) {
    return new Promise((resolve) => (this.#expected[correlation] = resolve))
  }

  async #replies (message) {
    const correlation = message.properties.correlationId
    const resolve = this.#expected[correlation]

    if (!resolve) {
      console.warn(`Unexpected reply '${correlation}'. Possible message redelivery.`)
      return
    }

    resolve(message)

    delete this.#expected[correlation]
    await this.#channel.ack(message)
  }
}

const QUEUE = { durable: true }
const EXCHANGE = { durable: true }

exports.Channel = Channel
