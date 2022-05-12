'use strict'

const { Process } = require('../process')
const { Operator } = require('./operator')
const { Factory: Images, Registry } = require('./images')
const { Deployment } = require('./deployment')
const { Composition } = require('./composition')

/**
 * @implements {toa.operations.deployment.Factory}
 */
class Factory {
  /** @type {toa.formation.context.Context} */
  #context
  /** @type {toa.operations.deployment.images.Registry} */
  #registry
  /** @type {toa.operations.Process} */
  #process

  /**
   * @param context {toa.formation.context.Context}
   */
  constructor (context) {
    this.#context = context
    this.#process = new Process()

    const images = new Images(context.name, context.runtime)
    this.#registry = new Registry(context.registry, images, this.#process)
  }

  operator () {
    const compositions = this.#context.compositions.map((composition) => this.#composition(composition))
    const dependencies = Factory.#dependencies({ ...this.#context.connectors, ...this.#context.extensions })
    const deployment = new Deployment(this.#context, compositions, dependencies, this.#process)

    return new Operator(deployment, this.#registry)
  }

  /**
   * @param composition {toa.formation.context.Composition}
   * @returns {toa.operations.deployment.Composition}
   */
  #composition (composition) {
    const image = this.#registry.composition(composition)

    return new Composition(composition, image)
  }

  /**
   * @param map {toa.formation.context.Dependencies}
   * @returns {Array<toa.operations.deployment.Dependency>}
   */
  static #dependencies (map) {
    /** @type {Array<toa.operations.deployment.Dependency>} */
    const dependencies = []

    for (const [location, instances] of Object.entries(map)) {
      const dependency = Factory.#dependency(location, instances)

      if (dependency !== undefined) dependencies.push(dependency)
    }

    return dependencies
  }

  /**
   * @param location {string} path to dependency package
   * @param instances {Array<toa.formation.context.Dependency>}
   * @returns {toa.operations.deployment.Dependency | undefined}
   */
  static #dependency (location, instances) {
    const dependency = require(location)

    if (dependency.deployment === undefined) return

    return dependency.deployment(instances)
  }
}

exports.Factory = Factory
