'use strict'

const { Connector } = require('@toa.io/core')
const { match } = require('@toa.io/libraries/generic')

const { context } = require('./sample')
const { ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.bindings.Emitter}
 */
class Emitter extends Connector {
  /** @type {string} */
  #label

  /** @type {toa.core.bindings.Emitter} */
  #emitter

  /**
   * @param {string} label
   * @param {toa.core.bindings.Emitter} emitter
   */
  constructor (label, emitter) {
    super()

    this.#label = label
    this.#emitter = emitter

    this.depends(emitter)
  }

  async emit (message) {
    /** @type {toa.sampling.Request} */
    const sample = context.get()

    const reference = sample?.events?.[this.#label]

    if (reference !== undefined) {
      const matches = match(message.payload, reference.payload)

      if (!matches) throw new ReplayException(`event '${this.#label}' payload mismatch`)
      else delete sample.events[this.#label]
    }

    if (sample?.autonomous !== true) {
      await this.#emitter.emit(message)
    }
  }
}

exports.Emitter = Emitter
