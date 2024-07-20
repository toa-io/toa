'use strict'

const workspace = require('./workspace')
const { newid } = require('@toa.io/generic')

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

    for (const image of this.#images) {
      await this.#build(image)
    }
  }

  async push () {
    await this.prepare()

    for (const image of this.#images) await this.#push(image)
  }

  tags () {
    return this.#images.map((image) => image.reference)
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
    if (await this.exists(image.reference)) {
      console.log('Image already exists, skipping:', image.reference)
      return
    }

    const args = ['--context=default', 'buildx', 'build']

    if (push) {
      args.push('--push')
    } else {
      args.push('--load')
    }

    args.push('--tag', image.reference, image.context)

    const multiarch = this.#registry.platforms !== null

    if (this.#registry.build?.arguments !== undefined) {
      for (const arg of this.#registry.build.arguments) args.push('--build-arg', `${arg}=${process.env[arg]}`)
    }

    if (multiarch) {
      const platform = this.#registry.platforms.join(',')
      const builder = await this.#createBuilder()

      args.push('--platform', platform)
      args.push('--builder', builder)
    } else {
      args.push('--builder', 'default')
    }

    args.push('--progress', 'plain')

    await this.#process.execute('docker', args)
  }

  async #push (image) {
    await this.#build(image, true)
  }

  async exists (tag) {
    const args = ['inspect', tag]

    try {
      await this.#process.execute('docker', args, { silently: true })
    } catch {
      return false
    }

    return true
  }

  async #createBuilder () {
    const name = `toa-${newid()}`
    const create = `buildx create --name ${name} --bootstrap --use`.split(' ')

    await this.#process.execute('docker', create)

    return name
  }
}

const BUILDER = 'toa'

exports.Registry = Registry
