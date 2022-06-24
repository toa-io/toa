'use strict'

const amqp = require('amqplib')

const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/libraries/console')

class Connection extends Connector {
  /** @type {URL} */
  #url
  #connection

  /**
   * @param url {URL}
   */
  constructor (url) {
    super()

    this.#url = url
  }

  async connection () {
    this.#connection = await amqp.connect(this.#url.href)

    console.info(`AMQP Binding connected to ${this.#url.host}`)
  }

  async disconnection () {
    // TODO: handle current operations
    // http://www.squaremobius.net/amqp.node/channel_api.html#model_close
    await this.#connection.close()

    console.info(`AMQP Binding disconnected from ${this.#url.host}`)
  }

  async channel () {
    return await this.#connection.createChannel()
  }
}

exports.Connection = Connection
