'use strict'

const { EventEmitter } = require('node:events')
const { lazy, promex } = require('@toa.io/libraries/generic')

/**
 * @implements {comq.Channel}
 */
class Channel {
  /** @type {comq.Topology} */
  #topology

  /** @type {comq.amqp.Channel} */
  #channel

  /** @type {string[]} */
  #tags = []

  /** @type {toa.generic.Promex} */
  #paused

  #diagnostics = new EventEmitter()

  /**
   * @param {comq.Topology} topology
   */
  constructor (topology) {
    this.#topology = topology
  }

  async create (connection) {
    const method = `create${this.#topology.confirms ? 'Confirm' : ''}Channel`

    this.#channel = await connection[method]()
  }

  consume = lazy(this, this.#assertQueue,
    /**
     * @param {string} queue
     * @param {comq.channels.consumer} callback
     */
    async (queue, callback) => {
      await this.#consume(queue, callback)
    })

  send = lazy(this, this.#assertQueue,
    /**
     * @param {string} queue
     * @param {Buffer} buffer
     * @param {comq.amqp.options.Publish} options
     */
    async (queue, buffer, options) => {
      await this.#publish(DEFAULT, queue, buffer, options)
    })

  subscribe = lazy(this,
    [this.#assertExchange, this.#assertBoundQueue],
    /**
     * @param {string} exchange
     * @param {string} queue
     * @param {comq.channels.consumer} callback
     * @returns {Promise<void>}
     */
    async (exchange, queue, callback) => {
      await this.#consume(queue, callback)
    })

  publish = lazy(this, this.#assertExchange,
    /**
     * @param {string} exchange
     * @param {Buffer} buffer
     * @param {import('amqplib').Options.Publish} [properties]
     */
    async (exchange, buffer, properties) => {
      await this.#publish(exchange, DEFAULT, buffer, properties)
    })

  async seal () {
    const cancellations = this.#tags.map((tag) => this.#channel.cancel(tag))

    await Promise.all(cancellations)
  }

  diagnose (event, listener) {
    this.#diagnostics.on(event, listener)
  }

  // region initializers

  /**
   * @param {string} name
   * @returns {Promise<void>}
   */
  async #assertQueue (name) {
    const options = this.#topology.durable ? DURABLE : EXCLUSIVE

    await this.#channel.assertQueue(name, options)
  }

  /**
   * @param {string} exchange
   * @returns {Promise<void>}
   */
  async #assertExchange (exchange) {
    /** @type {import('amqplib').Options.AssertExchange} */
    const options = { durable: this.#topology.durable }

    await this.#channel.assertExchange(exchange, 'fanout', options)
  }

  /**
   *
   * @param {string} exchange
   * @param {string} queue
   * @returns {Promise<void>}
   */
  async #assertBoundQueue (exchange, queue) {
    await this.#assertQueue(queue)
    await this.#channel.bindQueue(queue, exchange, '')
  }

  // endregion

  /**
   * @param {string} exchange
   * @param {string} queue
   * @param {Buffer} buffer
   * @param {comq.amqp.options.Publish} options
   */
  async #publish (exchange, queue, buffer, options) {
    if (this.#paused !== undefined) await this.#paused

    options = Object.assign({ persistent: this.#topology.persistent }, options)

    const confirmation = this.#topology.confirms ? promex() : undefined
    const resume = this.#channel.publish(exchange, queue, buffer, options, confirmation?.callback)

    if (resume === false) this.#pause()

    return confirmation
  }

  /**
   * @param {string} queue
   * @param {comq.channels.consumer} consumer
   * @returns {Promise<void>}
   */
  async #consume (queue, consumer) {
    /** @type {import('amqplib').Options.Consume} */
    const options = {}

    if (this.#topology.acknowledgements) consumer = this.#getAcknowledgingConsumer(consumer)
    else options.noAck = true

    const response = await this.#channel.consume(queue, consumer, options)

    this.#tags.push(response.consumerTag)
  }

  /**
   * @param {comq.channels.consumer} consumer
   * @returns {comq.channels.consumer}
   */
  #getAcknowledgingConsumer = (consumer) =>
    async (message) => {
      await consumer(message)

      this.#channel.ack(message)
    }

  #pause () {
    if (this.#paused !== undefined) return

    this.#paused = promex()
    this.#channel.once('drain', () => this.#unpause())
    this.#diagnostics.emit('flow')
  }

  #unpause () {
    this.#paused.resolve()
    this.#paused = undefined
    this.#diagnostics.emit('drain')
  }
}

/**
 * @param {comq.amqp.Connection} connection
 * @param {comq.Topology} topology
 * @return {Promise<comq.Channel>}
 */
const create = async (connection, topology) => {
  const channel = new Channel(topology)

  await channel.create(connection)

  return channel
}

const DEFAULT = ''

/** @type {import('amqplib').Options.AssertQueue} */
const DURABLE = { durable: true }

/** @type {import('amqplib').Options.AssertQueue} */
const EXCLUSIVE = { exclusive: true }

exports.create = create
