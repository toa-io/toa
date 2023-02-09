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

  /** @type {Record<string, toa.comq.channel.Queue>} */
  #queues = {}

  /**
   * @param {AMQPChannel} channel
   */
  constructor (channel) {
    this.#channel = channel
  }

  consume = lazy(this, this.#assert,
    /**
     * @param {string} queue
     * @param {boolean} durable
     * @param {toa.comq.channel.consumer} consumer
     * @returns {Promise<void>}
     */
    async (queue, durable, consumer) => {
      await this.#channel.consume(queue, this.#consume(consumer))
    })

  async send (queue, buffer, properties) {
    properties.persistent ??= true

    // TODO: handle `false` response
    // TODO: ConfirmChannel callback
    this.#channel.sendToQueue(queue, buffer, properties)
  }

  deliver = lazy(this, this.#persistent, this.send)

  subscribe = lazy(this, [this.#exchange, this.#bind],
    /**
     * @param {string} exchange
     * @param {string} queue
     * @param {toa.comq.channel.consumer} consumer
     * @returns {Promise<void>}
     */
    async (exchange, queue, consumer) => {
      await this.#channel.consume(queue, this.#consume(consumer))
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
  async #assert (queue, persistent) {
    if (!(queue in this.#queues)) {
      const options = persistent ? PERSISTENT : TRANSIENT
      const assertion = this.#channel.assertQueue(queue, options)

      this.#queues[queue] = { assertion }
    }

    return this.#queues[queue].assertion
  }

  /**
   * @param {string} queue
   * @returns {Promise<void>}
   */
  async #persistent (queue) {
    return this.#assert(queue, true)
  }

  /**
   * @param {string} exchange
   * @returns {Promise<void>}
   */
  async #exchange (exchange) {
    await this.#channel.assertExchange(exchange, FANOUT)
  }

  /**
   *
   * @param {string} exchange
   * @param {string} queue
   * @returns {Promise<void>}
   */
  async #bind (exchange, queue) {
    await this.#persistent(queue)
    await this.#channel.bindQueue(queue, exchange, EMPTY)
  }

  // endregion

  /**
   * @param {toa.comq.channel.consumer} consumer
   * @returns {toa.comq.channel.consumer}
   */
  #consume = (consumer) =>
    async (message) => {
      await consumer(message)

      this.#channel.ack(message)
    }
}

const HOUR = 3600 * 1000

/** @type {import('amqplib').Options.AssertQueue} */
const PERSISTENT = {}

/** @type {import('amqplib').Options.AssertQueue} */
const TRANSIENT = { arguments: { 'x-expires': HOUR } }

const FANOUT = 'fanout'
const EMPTY = ''

exports.Channel = Channel
