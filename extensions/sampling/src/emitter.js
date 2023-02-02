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
   * @param {toa.core.bindings.Emitter} emitter
   * @param {string} label
   */
  constructor (emitter, label) {
    super()

    this.#label = label
    this.#emitter = emitter

    this.depends(emitter)
  }

  async emit (message) {
    /** @type {toa.sampling.request.Sample} */
    const sample = context.get()
    const autonomous = sample?.autonomous ?? false
    const expected = sample?.events?.[this.#label]

    if (expected !== undefined) {
      const matches = match(message.payload, expected.payload)

      if (!matches) throw new ReplayException(`event '${this.#label}' payload mismatch`)
      else delete sample.events[this.#label]
    }

    if (!autonomous) await this.#emitter.emit(message)
  }
}

exports.Emitter = Emitter
