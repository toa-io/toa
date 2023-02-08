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
   * @param {boolean} durable
   * @returns {Promise<void>}
   */
  async #assert (queue, durable) {
    if (!(queue in this.#queues)) {
      const assertion = this.#channel.assertQueue(queue, { durable })

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

exports.Channel = Channel
