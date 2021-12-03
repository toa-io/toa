'use strict'

const amqp = require('amqplib')

const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/gears')

class Connection extends Connector {
  #url
  #connection

  constructor (host) {
    super()

    this.#url = Connection.#locate(host)
  }

  async connection () {
    this.#connection = await amqp.connect(this.#url)
    console.info(`AMQP Binding connected to ${this.#url}`)
  }

  async disconnection () {
    // TODO: handle current operations
    // http://www.squaremobius.net/amqp.node/channel_api.html#model_close
    await this.#connection.close()
    console.info(`AMQP Binding disconnected from ${this.#url}`)
  }

  async channel () {
    return this.#connection.createChannel()
  }

  static #locate (host) {
    // TODO: read ./deployments.js
    const user = 'user'
    const password = 'password'

    return `amqp://${user}:${password}@${host}`
  }
}

exports.Connection = Connection
