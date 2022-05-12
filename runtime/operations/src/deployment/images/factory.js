'use strict'

const { Composition } = require('./composition')

/**
 * @implements {toa.operations.deployment.images.Factory}
 */
class Factory {
  /** @type {string} */
  #scope
  /** @type {toa.formation.context.Runtime} */
  #runtime

  /**
   * @param scope {string}
   * @param runtime {toa.formation.context.Runtime}
   */
  constructor (scope, runtime) {
    this.#scope = scope
    this.#runtime = runtime
  }

  composition (composition) {
    return new Composition(this.#scope, this.#runtime, composition)
  }
}

exports.Factory = Factory
