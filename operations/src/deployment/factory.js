import { context as load, definition } from '@toa.io/norm'
import { Process } from '../process.js'
import { Operator } from './operator.js'
import { Factory as ImagesFactory } from './images/index.js'
import { Deployment } from './deployment.js'

import { Registry } from './registry.js'
import { Composition } from './composition.js'
import { Service } from './service.js'

export class Factory {
  #context
  #mono
  #compositions
  #dependencies
  #registry
  #process
  #image

  /** Which compositions run a given extension's service, rather than deploying it on its
   *  own. A service is stateless and already runs several replicas, so several compositions
   *  running one are replicas of it, behind the one Service that selects them all.
   *  @type {Map<string, string[]>} */
  #claims

  constructor(context, options = {}) {
    this.#context = context
    this.#mono = options.mono === true
    this.#process = new Process()

    const imagesFactory = new ImagesFactory(
      context.name,
      context.runtime,
      context.registry
    )

    this.#registry = new Registry(context.registry, imagesFactory, this.#process)
    this.#claims = claims(context)
    this.#dependencies = this.#getDependencies()
    this.#compositions = []

    if (this.#mono)
      this.#image = this.#registry.mono({
        components: context.components
      })
    else
      this.#compositions = context.compositions.map((composition) =>
        this.#composition(composition)
      )
  }

  async operator() {
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

  registry() {
    return this.#registry
  }

  #composition(composition) {
    const image = this.#registry.composition(composition)

    return new Composition(composition, image)
  }

  async #getDependencies() {
    /** @type {toa.deployment.Dependency[]} */
    const dependencies = []

    if (this.#context.dependencies === undefined) return dependencies

    /** the claimed references that turned out to contribute a service */
    const contributing = new Set()

    for (const [reference, instances] of Object.entries(this.#context.dependencies)) {
      const dependency = await this.#getDependency(reference, instances)

      if (dependency === undefined) continue

      if (dependency.services?.length > 0) contributing.add(reference)

      dependencies.push(dependency)
    }

    // this is the first point where every `deployment()` has run, so it is the first
    // point where a reference that yields nothing can be told from one that yields a service
    for (const [reference, compositions] of this.#claims)
      if (!contributing.has(reference))
        throw new Error(
          `Composition '${compositions[0]}' lists '${reference}', ` +
            'which contributes no service.'
        )

    return dependencies
  }

  async #getDependency(reference, instances) {
    const { name, module } = await definition(reference)

    if (module.deployment === undefined) return

    const annotation = this.#context.annotations?.[name]

    /** @type {toa.deployment.dependency.Declaration} */
    const dependency = module.deployment(instances, annotation)

    // mono claims every service, including one an extension added since this context was
    // written, so its claim is the wildcard rather than a list
    const workload = this.#mono ? [MONO] : this.#claims.get(reference)

    /** @type {toa.deployment.Service[]} */
    const services = dependency.services?.map((service) =>
      workload === undefined
        ? this.#service(reference, service) // its own deployment, its own image
        : // named the way `Service` would name it, since it skips that wrapper
          { ...service, name: `${service.group}-${service.name}`, workload }
    )

    return { ...dependency, services }
  }

  /**
   * @param path {string}
   * @param service {toa.deployment.dependency.Service}
   * @returns {Service}
   */
  #service(path, service) {
    // an extension that publishes its service's image is taken at its word: nothing is
    // added to the registry, so nothing is prepared, probed, built or pushed for it
    const published =
      service.image !== undefined && this.#context.registry?.services === PUBLISHED

    const image = published
      ? { reference: `${service.image}:${this.#context.runtime.version}` }
      : this.#registry.service(path, service)

    return new Service(service, image)
  }

  static async create(path, environment, options = {}) {
    const context = await load(path, environment)

    return new Factory(context, options)
  }
}

const MONO = 'mono'

const PUBLISHED = 'published'

/**
 * @param {toa.norm.Context} context
 * @returns {Map<string, string[]>}
 */
function claims(context) {
  const map = new Map()

  for (const composition of context.compositions ?? [])
    for (const reference of composition.services ?? []) {
      if (!map.has(reference)) map.set(reference, [])

      map.get(reference).push(composition.name)
    }

  return map
}
