'use strict'

const { lazy } = require('@toa.io/libraries/generic')

/**
 * @implements {toa.messenger.Channel}
 */
class Channel {
  /** @type {import('amqplib').Channel} */
  #channel

  /** @type {Record<string, toa.messenger.channel.Queue>} */
  #queues = {}

  /**
   * @param {import('amqplib').Channel} channel
   */
  constructor (channel) {
    this.#channel = channel
  }

  consume = lazy(this, this.#assert,
    /**
     * @param {string} queue
     * @param {boolean} durable
     * @param {toa.messenger.consumer} consumer
     * @returns {Promise<void>}
     */
    async (queue, durable, consumer) => {
      // TODO: ack
      await this.#channel.consume(queue, consumer)
    })

  async send (queue, buffer, properties) {
    // TODO: handle `false` response
    this.#channel.sendToQueue(queue, buffer, properties)
  }

  deliver = lazy(this, this.#durable, this.send)

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
}

exports.Channel = Channel
