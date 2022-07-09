'use strict'

const { Composition } = require('./composition')
const { Service } = require('./service')

/**
 * @implements {toa.deployment.images.Factory}
 */
class Factory {
  /** @type {string} */
  #scope
  /** @type {toa.norm.context.Runtime} */
  #runtime

  /**
   * @param scope {string}
   * @param runtime {toa.norm.context.Runtime}
   */
  constructor (scope, runtime) {
    this.#scope = scope
    this.#runtime = runtime
  }

  /**
   * @returns {Composition}
   */
  composition (composition) {
    return new Composition(this.#scope, this.#runtime, composition)
  }

  /**
   * @returns {Service}
   */
  service (path, service) {
    return new Service(this.#scope, this.#runtime, path, service)
  }
}

exports.Factory = Factory
