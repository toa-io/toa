'use strict'

const amqp = require('amqplib')

const { Connector, id } = require('@kookaburra/core')
const { console } = require('@kookaburra/gears')

const { pack, unpack } = require('./message')

class Channel extends Connector {
  #id
  #locator
  #connection
  #channel

  #bound = {}
  #expected = {}

  constructor (host) {
    super()

    this.#id = id()
    this.#locator = Channel.#url(host)
  }

  async connection () {
    this.#connection = await amqp.connect(this.#locator)
    this.#channel = await this.#connection.createChannel()

    console.info(`AMQP Binding connected to ${this.#locator}`)
  }

  async disconnection () {
    // TODO: handle current operations
    // http://www.squaremobius.net/amqp.node/channel_api.html#model_close
    await this.#connection.close()
  }

  disconnected () {
    console.info(`AMQP Binding disconnected from ${this.#locator}`)
  }

  async request (label, request) {
    if (request === undefined) request = {}

    const queue = 'request.' + label
    const correlation = id()

    await this.#channel.assertQueue(queue, QUEUE)
    await this.#bind(label)

    const message = pack(request)
    const properties = { replyTo: this.#id, correlationId: correlation }

    this.#channel.sendToQueue(queue, message, properties)

    const reply = await this.#reply(label, correlation)

    return unpack(reply.content)
  }

  async transmit (label, payload) {
    if (payload === undefined) payload = {}

    const queue = 'event.' + label

    await this.#channel.assertQueue(queue, QUEUE)

    const message = pack(payload)

    this.#channel.sendToQueue(queue, message)
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

      this.#channel.publish(exchange, received.properties.replyTo, message, properties)
      this.#channel.ack(received)
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

  #replies (message) {
    const correlation = message.properties.correlationId
    const resolve = this.#expected[correlation]

    if (!resolve) {
      console.warn(`Unexpected reply '${correlation}'. Possible message redelivery.`)
      return
    }

    resolve(message)

    delete this.#expected[correlation]
    this.#channel.ack(message)
  }

  static #url (host) {
    if (process.env.KOO_ENV === 'dev') return 'amqp://guest:guest@localhost/'

    return 'amqp://' + host
  }
}

const QUEUE = { durable: process.env.KOO_ENV !== 'dev' }
const EXCHANGE = { durable: process.env.KOO_ENV !== 'dev' }

exports.Channel = Channel
