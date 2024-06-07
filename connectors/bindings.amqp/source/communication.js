'use strict'

const { assert } = require('comq')
const { Connector } = require('@toa.io/core')

class Communication extends Connector {
  #resolve

  /** @type {comq.IO} */
  #io

  constructor (resolve) {
    super()

    this.#resolve = resolve
  }

  async open () {
    const references = await this.#resolve()

    this.#io = await assert(...references)
  }

  async close () {
    await this.#io?.seal()
  }

  async dispose () {
    await this.#io?.close()
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

  async process (queue, consumer) {
    await this.#io.process(queue, consumer)
  }

  async enqueue (queue, message) {
    await this.#io.enqueue(queue, message)
  }
}

exports.Communication = Communication
