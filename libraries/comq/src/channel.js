'use strict'

/**
 * @typedef {import('amqplib').Channel | import('amqplib').ConfirmChannel} AMQPChannel
 */

const { lazy } = require('@toa.io/libraries/generic')

/**
 * @implements {toa.comq.Channel}
 */
class Channel {
  /** @type {import('amqplib').Channel} */
  #channel

  /**
   * @param {AMQPChannel} channel
   */
  constructor (channel) {
    this.#channel = channel
  }

  consume = lazy(this, this.#assertQueue,
    /**
     * @param {string} queue
     * @param {boolean} durable
     * @param {toa.comq.channel.consumer} callback
     * @returns {Promise<void>}
     */
    async (queue, durable, callback) => {
      const consumer = this.#getAcknowledgingConsumer(callback)

      await this.#channel.consume(queue, consumer)
    })

  async send (queue, buffer, properties) {
    properties.persistent ??= true

    // TODO: handle `false` response
    // TODO: ConfirmChannel callback
    this.#channel.sendToQueue(queue, buffer, properties)
  }

  deliver = lazy(this, this.#assertPersistentQueue, this.send)

  subscribe = lazy(this,
    [this.#assertExchange, this.#bindQueue],
    /**
     * @param {string} exchange
     * @param {string} queue
     * @param {toa.comq.channel.consumer} callback
     * @returns {Promise<void>}
     */
    async (exchange, queue, callback) => {
      const consumer = this.#getAcknowledgingConsumer(callback)

      await this.#channel.consume(queue, consumer)
    })

  async close () {
    await this.#channel.close()
  }

  // region initializers

  /**
   * @param {string} queue
   * @param {boolean} persistent
   * @returns {Promise<void>}
   */
  async #assertQueue (queue, persistent) {
    const options = persistent ? PERSISTENT_QUEUE : TRANSIENT_QUEUE

    await this.#channel.assertQueue(queue, options)
  }

  /**
   * @param {string} queue
   * @returns {Promise<void>}
   */
  async #assertPersistentQueue (queue) {
    return this.#assertQueue(queue, true)
  }

  /**
   * @param {string} exchange
   * @returns {Promise<void>}
   */
  async #assertExchange (exchange) {
    await this.#channel.assertExchange(exchange, FANOUT)
  }

  /**
   *
   * @param {string} exchange
   * @param {string} queue
   * @returns {Promise<void>}
   */
  async #bindQueue (exchange, queue) {
    await this.#assertPersistentQueue(queue)
    await this.#channel.bindQueue(queue, exchange, DEFAULT_ROUTING_KEY)
  }

  // endregion

  /**
   * @param {toa.comq.channel.consumer} callback
   * @returns {toa.comq.channel.consumer}
   */
  #getAcknowledgingConsumer = (callback) =>
    async (message) => {
      await callback(message)

      this.#channel.ack(message)
    }
}

const HOUR = 3600 * 1000

/** @type {import('amqplib').Options.AssertQueue} */
const PERSISTENT_QUEUE = {}

/** @type {import('amqplib').Options.AssertQueue} */
const TRANSIENT_QUEUE = { arguments: { 'x-expires': HOUR } }

const FANOUT = 'fanout'
const DEFAULT_ROUTING_KEY = ''

exports.Channel = Channel
