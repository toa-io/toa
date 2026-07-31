'use strict'

const { posix } = require('node:path')
const workspace = require('./workspace')

/**
 * @implements {toa.deployment.Registry}
 */
class Registry {
  #scope

  #registry

  #factory

  #process

  #images = []

  /** @type {string | undefined} */
  #builder

  constructor (scope, registry, factory, process) {
    this.#scope = scope
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

    for (const image of this.#images)
      await this.#build(image)
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

    if (push)
      args.push('--push')
    else
      args.push('--load')

    args.push('--tag', image.reference, image.context)

    const multiarch = this.#registry.platforms !== null

    if (this.#registry.build?.arguments !== undefined) {
      for (const arg of this.#registry.build.arguments) args.push('--build-arg', `${arg}=${process.env[arg]}`)
    }

    if (multiarch) {
      const platform = this.#registry.platforms.join(',')
      const builder = await this.#ensureBuilder()

      args.push('--platform', platform)
      args.push('--builder', builder)

      if (this.#registry.base !== undefined)
        this.#appendCache(args)
    } else
      args.push('--builder', 'default')

    args.push('--progress', 'plain')

    await this.#process.execute('docker', args)
  }

  async #push (image) {
    await this.#build(image, true)
  }

  async exists (tag) {
    const args = ['manifest', 'inspect', tag]

    try {
      await this.#process.execute('docker', args, { silently: true })
    } catch (error) {
      console.log(error.message)

      return false
    }

    return true
  }

  async #ensureBuilder () {
    if (this.#builder !== undefined)
      return this.#builder

    try {
      await this.#process.execute('docker', ['buildx', 'inspect', BUILDER], { silently: true })
    } catch {
      await this.#process.execute('docker', ['buildx', 'create', '--name', BUILDER, '--bootstrap'])
    }

    this.#builder = BUILDER

    return BUILDER
  }

  /**
   * @param {string[]} args
   */
  #appendCache (args) {
    const ref = posix.join(this.#registry.base, this.#scope, 'buildcache')

    args.push('--cache-from', `type=registry,ref=${ref}`)
    args.push('--cache-to', `type=registry,ref=${ref},mode=max,image-manifest=true`)
  }
}

const BUILDER = 'toa'

exports.Registry = Registry
