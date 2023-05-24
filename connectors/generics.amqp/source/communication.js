'use strict'

const { connect } = require('comq')
const { Connector } = require('@toa.io/core')
const { console } = require('@toa.io/console')

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

    console.info(`AMQP connection to ${this.#labels()} is established`)
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

  #labels () {
    return this.#references.map(label).join(', ')
  }
}

/**
 * @param {string} reference
 * @return {string}
 */
function label (reference) {
  const url = new URL(reference)

  url.password = ''

  return url.href
}

exports.Communication = Communication
