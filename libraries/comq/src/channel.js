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
     * @param {toa.comq.consumer} consumer
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

  deliver = lazy(this, this.#durable, this.send)

  async close () {
    await this.#channel.close()
  }

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
  async #durable (queue) {
    return this.#assert(queue, true)
  }

  /**
   * @param {toa.comq.consumer} consumer
   * @returns {toa.comq.consumer}
   */
  #consume = (consumer) =>
    async (message) => {
      await consumer(message)

      this.#channel.ack(message)
    }
}

/** @type {import('amqplib').Options.AssertQueue} */
const PERSISTENT = {}

const HOUR = 3600 * 1000

/** @type {import('amqplib').Options.AssertQueue} */
const TRANSIENT = { arguments: { 'x-expires': HOUR } }

exports.Channel = Channel
