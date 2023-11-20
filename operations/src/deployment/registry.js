'use strict'

const workspace = require('./workspace')

/**
 * @implements {toa.deployment.Registry}
 */
class Registry {
  #registry

  #factory

  #process

  #images = []

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

  async prepare (root) {
    const path = await workspace.create('images', root)

    await Promise.all(this.#images.map((image) => image.prepare(path)))

    return path
  }

  async build () {
    await this.prepare()

    for (const image of this.#images) await this.#build(image)
  }

  async push () {
    await this.prepare()

    for (const image of this.#images) await this.#push(image)
  }

  /**
   * @param {'composition' | 'service'} type
   * @param {...any} args
   * @returns {toa.deployment.images.Image}
   */
  #create (type, ...args) {
    const image = this.#factory[type](...args)

    this.#images.push(image)

    return image
  }

  /**
   * @param {toa.deployment.images.Image} image
   * @param {boolean} [push]
   * @returns {Promise<void>}
   */
  async #build (image, push = false) {
    const args = ['--context=default', 'buildx', 'build']

    if (push) args.push('--push')

    args.push('--tag', image.reference, image.context)

    const multiarch = this.#registry.platforms !== null

    if (this.#registry.build?.arguments !== undefined) {
      for (const arg of this.#registry.build.arguments) args.push('--build-arg', `${arg}=${process.env[arg]}`)
    }

    if (multiarch) {
      const platform = this.#registry.platforms.join(',')

      args.push('--platform', platform)
      args.push('--builder', BUILDER)

      await this.#ensureBuilder()
    } else args.push('--builder', 'default')

    args.push('--progress', 'plain')

    await this.#process.execute('docker', args)
  }

  async #push (image) {
    await this.#build(image, true)
  }

  async #ensureBuilder () {
    const ls = 'buildx ls'.split(' ')
    const output = await this.#process.execute('docker', ls, { silently: true })
    const exists = output.split('\n').findIndex((line) => line.startsWith('toa '))

    if (exists === -1) await this.#createBuilder()
  }

  async #createBuilder () {
    const create = `buildx create --name ${BUILDER} --use`.split(' ')
    const bootstrap = 'buildx inspect --bootstrap'.split(' ')

    await this.#process.execute('docker', create)
    await this.#process.execute('docker', bootstrap)
  }
}

const BUILDER = 'toa'

exports.Registry = Registry
