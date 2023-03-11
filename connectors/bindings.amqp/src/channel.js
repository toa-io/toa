'use strict'

const { Connector } = require('@toa.io/core')
const { newid, timeout } = require('@toa.io/generic')
const { console } = require('@toa.io/console')

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
    this.#channel.prefetch(100)
  }

  async disconnection () {
    // solves 'Channel ended, no reply will be forthcoming'
    await timeout(50)
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

      const buffer = pack(reply)
      const properties = { correlationId: received.properties.correlationId }

      await this.#channel.publish(exchange, received.properties.replyTo, buffer, properties)
      await this.#channel.ack(received)
    })
  }

  async publish (label, content, options) {
    const exchange = 'event.' + label

    // TODO: assert once per exchange
    await this.#channel.assertExchange(exchange, 'fanout', EXCHANGE)

    const buffer = pack(content)

    await this.#channel.publish(exchange, '', buffer, options)
  }

  async subscribe (label, id, callback) {
    const exchange = 'event.' + label
    const queue = exchange + '..' + id
    const options = { consumerTag: id }

    await this.#channel.assertExchange(exchange, 'fanout', EXCHANGE)
    await this.#channel.assertQueue(queue, QUEUE)
    await this.#channel.bindQueue(queue, exchange, '')

    await this.#channel.consume(queue, async (message) => {
      const content = unpack(message.content)
      await callback(content)
      await this.#channel.ack(message)
    }, options)
  }

  async unsubscribe (id) {
    await this.#channel.cancel(id)
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
