'use strict'

const { Connector } = require('@toa.io/core')

/**
 * @implements {toa.extensions.configuration.Aspect}
 */
class Aspect extends Connector {
  /** @readonly */
  name = 'configuration'

  /** @type {toa.core.Reflection} */
  #refection

  /**
   * @param {toa.core.Reflection} reflection
   */
  constructor (reflection) {
    super()

    this.#refection = reflection

    this.depends(reflection)
  }

  invoke (path) {
    /** @type {any} */
    let cursor = this.#refection.value

    if (path !== undefined) for (const segment of path) cursor = cursor[segment]

    return cursor
  }
}

exports.Aspect = Aspect
