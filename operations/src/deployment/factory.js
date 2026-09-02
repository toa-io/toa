import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { context as load } from '@toa.io/norm'
import { Process } from '../process.js'
import { Operator } from './operator.js'
import { Factory as ImagesFactory } from './images/index.js'
import { Deployment } from './deployment.js'

// a dependency is resolved the way a package is
const require = createRequire(import.meta.url)
import { Registry } from './registry.js'
import { Composition } from './composition.js'
import { Service } from './service.js'

class Factory {
  #context
  #mono
  #compositions
  #dependencies
  #registry
  #process
  #image

  constructor (context, options = {}) {
    this.#context = context
    this.#mono = options.mono === true
    this.#process = new Process()

    const imagesFactory = new ImagesFactory(context.name, context.runtime, context.registry)

    this.#registry = new Registry(context.name, context.registry, imagesFactory, this.#process)
    this.#dependencies = this.#getDependencies()
    this.#compositions = []

    if (this.#mono)
      this.#image = this.#registry.mono({
        components: context.components
      })
    else
      this.#compositions = context.compositions.map((composition) => this.#composition(composition))
  }

  async operator () {
    const deployment = new Deployment(
      this.#context,
      this.#compositions,
      // the constructor cannot await, so what it started is settled here
      await this.#dependencies,
      this.#process,
      this.#image
    )

    return new Operator(deployment, this.#registry)
  }

  registry () {
    return this.#registry
  }

  #composition (composition) {
    const image = this.#registry.composition(composition)

    return new Composition(composition, image)
  }

  async #getDependencies () {
    /** @type {toa.deployment.Dependency[]} */
    const dependencies = []

    if (this.#context.dependencies === undefined) return dependencies

    for (const [reference, instances] of Object.entries(this.#context.dependencies)) {
      const dependency = await this.#getDependency(reference, instances)

      if (dependency !== undefined) dependencies.push(dependency)
    }

    return dependencies
  }

  async #getDependency (reference, instances) {
    // a dependency is named the way a package is, not written as a path
    const module = await import(reference)
    const pkg = JSON.parse(readFileSync(require.resolve(join(reference, 'package.json')), 'utf8'))

    if (module.deployment === undefined) return

    const annotation = this.#context.annotations?.[pkg.name]

    /** @type {toa.deployment.dependency.Declaration} */
    const dependency = module.deployment(instances, annotation)

    /** @type {toa.deployment.Service[]} */
    const services = dependency.services?.map((service) =>
      this.#mono ? service : this.#service(reference, service))

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

  static async create (path, environment, options = {}) {
    const context = await load(path, environment)

    return new Factory(context, options)
  }
}

export { Factory }
