'use strict'

const { directory: { remove } } = require('@toa.io/gears')

/**
 * @implements {toa.operations.deployment.images.Registry}
 */
class Registry {
  /** @type {toa.formation.context.Registry} */
  #registry
  /** @type {toa.operations.deployment.images.Factory} */
  #factory
  /** @type {toa.operations.Process} */
  #process
  /** @type {Array<toa.operations.deployment.images.Image>} */
  #images = []

  /**
   * @param registry {toa.formation.context.Registry}
   * @param factory {toa.operations.deployment.images.Factory}
   * @param process {toa.operations.Process}
   */
  constructor (registry, factory, process) {
    this.#registry = registry
    this.#factory = factory
    this.#process = process
  }

  composition (composition) {
    return this.#create('composition', composition)
  }

  service (path, service) {
    return this.#create('service', path, service)
  }

  async prepare (target) {
    await Promise.all(this.#images.map((image) => image.prepare(target)))
  }

  async push () {
    for (const image of this.#images) {
      await this.#push(image)
      await remove(image.context)
    }
  }

  /**
   * @param type {"composition" | "service"}
   * @param args {...any}
   * @returns {toa.operations.deployment.images.Image}
   */
  #create (type, ...args) {
    const image = this.#factory[type](...args)

    image.tag(this.#registry.base)
    this.#images.push(image)

    return image
  }

  /**
   * @param image {toa.operations.deployment.images.Image}
   * @returns {Promise<void>}
   */
  async #push (image) {
    const platform = this.#registry.platforms.join(',')

    await this.#process.execute('docker',
      ['buildx', 'build', '--push', '--tag', image.reference, '--platform', platform, image.context])
  }
}

exports.Registry = Registry
