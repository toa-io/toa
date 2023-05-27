'use strict'

const { Process } = require('../process')
const { Operator } = require('./operator')
const { Factory: ImagesFactory } = require('./images')
const { Deployment } = require('./deployment')
const { Registry } = require('./registry')
const { Composition } = require('./composition')
const { Service } = require('./service')

/**
 * @implements {toa.deployment.Factory}
 */
class Factory {
  /** @type {toa.norm.Context} */
  #context

  /** @type {Composition[]} */
  #compositions

  /** @type {toa.deployment.Dependency[]} */
  #dependencies

  /** @type {toa.deployment.Registry} */
  #registry

  /** @type {toa.operations.Process} */
  #process

  /**
   * @param context {toa.norm.Context}
   */
  constructor (context) {
    this.#context = context
    this.#process = new Process()

    const imagesFactory = new ImagesFactory(context.name, context.runtime)

    this.#registry = new Registry(context.registry, imagesFactory, this.#process)
    this.#compositions = context.compositions.map((composition) => this.#composition(composition))
    this.#dependencies = this.#getDependencies()
  }

  operator () {
    const deployment = new Deployment(this.#context, this.#compositions, this.#dependencies, this.#process)

    return new Operator(deployment, this.#registry)
  }

  registry () {
    return this.#registry
  }

  /**
   * @param composition {toa.norm.context.Composition}
   * @returns {Composition}
   */
  #composition (composition) {
    const image = this.#registry.composition(composition)

    return new Composition(composition, image)
  }

  /**
   * @returns {toa.deployment.Dependency[]}
   */
  #getDependencies () {
    /** @type {toa.deployment.Dependency[]} */
    const dependencies = []

    for (const [reference, instances] of Object.entries(this.#context.dependencies)) {
      const dependency = this.#getDependency(reference, instances)

      if (dependency !== undefined) dependencies.push(dependency)
    }

    return dependencies
  }

  /**
   * @param {string} path
   * @param {toa.norm.context.dependencies.Instance[]} instances
   * @returns {toa.deployment.Dependency | undefined}
   */
  #getDependency (path, instances) {
    const module = require(path)
    const pkg = require(path + '/package.json')

    if (module.deployment === undefined) return

    const annotations = this.#context.annotations?.[pkg.name]

    /** @type {toa.deployment.dependency.Declaration} */
    const dependency = module.deployment(instances, annotations)

    /** @type {toa.deployment.Service[]} */
    const services = dependency.services?.map((service) => this.#service(path, service))

    return { ...dependency, services }
  }

  /**
   * @param path {string}
   * @param service {toa.deployment.dependency.Service}
   * @returns {Service}
   */
  #service (path, service) {
    const image = this.#registry.service(path, service)

    return new Service(service, image)
  }
}

exports.Factory = Factory
