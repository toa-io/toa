import { Composition } from './composition.js'
import { Service } from './service.js'
import { Mono } from './mono.js'

class Factory {
  /** @type {string} */
  #scope

  /** @type {toa.norm.context.Runtime} */
  #runtime

  /** @type {toa.norm.context.Registry} */
  #registry

  /**
   * @param {string} scope
   * @param {toa.norm.context.Runtime} runtime
   * @param {toa.norm.context.Registry} registry
   */
  constructor (scope, runtime, registry) {
    this.#scope = scope
    this.#runtime = runtime
    this.#registry = registry
  }

  /**
   * @returns {Composition}
   */
  composition (composition) {
    const instance = new Composition(this.#scope, this.#runtime, this.#registry, composition)

    instance.tag()

    return instance
  }

  /**
   * @returns {Service}
   */
  service (path, service) {
    const instance = new Service(this.#scope, this.#runtime, this.#registry, path, service)

    instance.tag()

    return instance
  }

  /**
   * @returns {Mono}
   */
  mono (composition) {
    const instance = new Mono(this.#scope, this.#runtime, this.#registry, composition)

    instance.tag()

    return instance
  }
}

export { Factory }
