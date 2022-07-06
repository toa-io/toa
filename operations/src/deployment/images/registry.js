'use strict'

const { directory: { remove } } = require('@toa.io/libraries/filesystem')

/**
 * @implements {toa.operations.deployment.images.Registry}
 */
class Registry {
  /** @type {toa.norm.context.Registry} */
  #registry
  /** @type {toa.operations.deployment.images.Factory} */
  #factory
  /** @type {toa.operations.Process} */
  #process
  /** @type {Array<toa.operations.deployment.images.Image>} */
  #images = []

  /**
   * @param {toa.norm.context.Registry} registry
   * @param {toa.operations.deployment.images.Factory} factory
   * @param {toa.operations.Process} process
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
   * @param {"composition" | "service"} type
   * @param {...any} args
   * @returns {toa.operations.deployment.images.Image}
   */
  #create (type, ...args) {
    const image = this.#factory[type](...args)

    image.tag(this.#registry.base)
    this.#images.push(image)

    return image
  }

  /**
   * @param {toa.operations.deployment.images.Image} image
   * @returns {Promise<void>}
   */
  async #push (image) {
    const args = ['buildx', 'build', '--push', '--tag', image.reference, image.context]
    const local = this.#registry.platforms === null

    if (local) {
      args.push('--builder', 'default')
    } else {
      const platform = this.#registry.platforms.join(',')

      args.push('--platform', platform)
      args.push('--builder', BUILDER)

      await this.#builder()
    }

    await this.#process.execute('docker', args)
  }

  async #builder () {
    const ls = 'buildx ls'.split(' ')
    const output = await this.#process.execute('docker', ls, { silently: true })

    const exists = output.split('\n').find((line) => line.startsWith('toa '))

    if (exists === undefined) {
      const create = `buildx create --name ${BUILDER} --use`.split(' ')
      const bootstrap = 'buildx inspect --bootstrap'.split(' ')

      await this.#process.execute('docker', create)
      await this.#process.execute('docker', bootstrap)
    }
  }
}

const BUILDER = 'toa'

exports.Registry = Registry
