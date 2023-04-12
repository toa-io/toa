'use strict'

const { connect } = require('comq')
const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.amqp.Communication}
 */
class Communication extends Connector {
  /** @type {string[]} */
  #references

  /** @type {comq.IO} */
  #io

  /**
   * @param {string[]} references
   */
  constructor (references) {
    super()

    this.#references = references
  }

  async open () {
    this.#io = await connect(...this.#references)
  }

  async close () {
    await this.#io.seal()
  }

  async dispose () {
    if (this.#io !== undefined) await this.#io.close()
  }

  async reply (queue, process) {
    await this.#io.reply(queue, process)
  }

  async request (queue, request) {
    return this.#io.request(queue, request)
  }

  async emit (exchange, message, properties) {
    await this.#io.emit(exchange, message, properties)
  }

  async consume (exchange, group, consumer) {
    await this.#io.consume(exchange, group, consumer)
  }
}

exports.Communication = Communication
