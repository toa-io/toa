'use strict'

const amqp = require('amqplib')

const { Channel } = require('./channel')

/**
 * @implements {comq.Connection}
 */
class Connection {
  /** @type {string} */
  #url

  /** @type {import('amqplib').Connection} */
  #connection

  /**
   * @param {string} url
   */
  constructor (url) {
    this.#url = url
  }

  async connect () {
    this.#connection = await amqp.connect(this.#url)
  }

  async close () {
    await this.#connection.close()
  }

  async in () {
    const chan = await this.#connection.createChannel()

    // despite the documentation statement, it returns a Promise
    // https://amqp-node.github.io/amqplib/channel_api.html#channel_prefetch
    await chan.prefetch(300)

    return new Channel(chan)
  }

  async out () {
    const chan = await this.#connection.createConfirmChannel()

    return new Channel(chan)
  }
}

exports.Connection = Connection
