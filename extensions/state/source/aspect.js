'use strict'

const { overwrite } = require('@toa.io/generic')

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.core.extensions.Aspect}
 */
class Aspect extends Connector {
  name = 'state'

  /** @type {object} */
  #value = {}

  /**
   * @param {object} value
   */
  invoke (value) {
    if (value === undefined) return this.#value
    else this.#set(value)
  }

  #set (value) {
    overwrite(this.#value, value)
  }
}

exports.Aspect = Aspect
