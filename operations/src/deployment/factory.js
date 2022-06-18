'use strict'

const { Process } = require('../process')
const { Operator } = require('./operator')
const { Factory: Images, Registry } = require('./images')
const { Deployment } = require('./deployment')
const { Composition } = require('./composition')
const { Service } = require('./service')

/**
 * @implements {toa.operations.deployment.Factory}
 */
class Factory {
  /** @type {toa.formation.Context} */
  #context
  /** @type {toa.operations.deployment.images.Registry} */
  #registry
  /** @type {toa.operations.Process} */
  #process

  /**
   * @param context {toa.formation.Context}
   */
  constructor (context) {
    this.#context = context
    this.#process = new Process()

    const images = new Images(context.name, context.runtime)
    this.#registry = new Registry(context.registry, images, this.#process)
  }

  operator () {
    const compositions = this.#context.compositions.map((composition) => this.#composition(composition))
    const dependencies = this.#dependencies()
    const deployment = new Deployment(this.#context, compositions, dependencies, this.#process)

    return new Operator(deployment, this.#registry)
  }

  /**
   * @param composition {toa.formation.context.Composition}
   * @returns {Composition}
   */
  #composition (composition) {
    const image = this.#registry.composition(composition)

    return new Composition(composition, image)
  }

  /**
   * @returns {Array<toa.operations.deployment.Dependency>}
   */
  #dependencies () {
    /** @type {toa.formation.context.Dependencies} */
    const map = { ...this.#context.connectors, ...this.#context.extensions }
    /** @type {Array<toa.operations.deployment.Dependency>} */
    const dependencies = []

    for (const [location, instances] of Object.entries(map)) {
      const dependency = this.#dependency(location, instances)

      if (dependency !== undefined) dependencies.push(dependency)
    }

    return dependencies
  }

  /**
   * @param {string} path
   * @param {toa.formation.context.Dependency[]} declarations
   * @returns {toa.operations.deployment.Dependency | undefined}
   */
  #dependency (path, declarations) {
    const module = require(path)
    const pkg = require(path + '/package.json')

    if (module.deployment === undefined) return

    const annotations = this.#context.annotations?.[pkg.name]
    /** @type {toa.operations.deployment.dependency.Declaration} */
    const dependency = module.deployment(declarations, annotations)

    /** @type {toa.operations.deployment.Service[]} */
    const services = dependency.services?.map((service) => this.#service(path, service))

    return { references: dependency.references, services, proxies: dependency.proxies }
  }

  /**
   * @param path {string}
   * @param service {toa.operations.deployment.dependency.Service}
   * @returns {Service}
   */
  #service (path, service) {
    const image = this.#registry.service(path, service)

    return new Service(service, image)
  }
}

exports.Factory = Factory
