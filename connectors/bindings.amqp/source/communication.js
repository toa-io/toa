'use strict'

const { connect } = require('comq')
const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.amqp.Communication}
 */
class Communication extends Connector {
  /** @type {toa.pointer.Pointer} */
  #pointer

  /** @type {comq.IO} */
  #io

  /**
   * @param {toa.pointer.Pointer} pointer
   */
  constructor (pointer) {
    super()

    this.#pointer = pointer
  }

  async open () {
    this.#io = await connect(this.#pointer.reference)
  }

  async close () {
    await this.#io.seal()
  }

  async dispose () {
    await this.#io.close()
  }

  async reply (queue, process) {
    await this.#io.reply(queue, process)
  }

  async request (queue, request) {
    return this.#io.request(queue, request)
  }
}

exports.Communication = Communication
