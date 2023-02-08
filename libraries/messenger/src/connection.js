'use strict'

const amqp = require('amqplib')

const { Channel } = require('./channel')

/**
 * @implements {toa.messenger.Connection}
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

    // noinspection ES6MissingAwait
    chan.prefetch(300)

    return new Channel(chan)
  }

  async out () {
    const chan = await this.#connection.createConfirmChannel()

    return new Channel(chan)
  }
}

exports.Connection = Connection
