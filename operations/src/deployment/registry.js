import * as workspace from './workspace.js'

/**
 * @implements {toa.deployment.Registry}
 */
export class Registry {
  #registry

  #factory

  #process

  #images = []

  /** @type {Promise<string> | undefined} */
  #builder

  constructor(registry, factory, process) {
    this.#registry = registry
    this.#factory = factory
    this.#process = process
  }

  composition(composition) {
    return this.#create('composition', composition)
  }

  service(path, service) {
    return this.#create('service', path, service)
  }

  mono(composition) {
    return this.#create('mono', composition)
  }

  async prepare(root) {
    const path = await workspace.create('images', root)

    await Promise.all(this.#images.map((image) => image.prepare(path)))

    return path
  }

  async build() {
    await this.prepare()
    await this.#run(false)
  }

  async push() {
    await this.prepare()
    await this.#run(true)
  }

  tags() {
    return this.#images.map((image) => image.reference)
  }

  /**
   * @param {'composition' | 'service' | 'mono'} type
   * @param {...any} args
   * @returns {toa.deployment.images.Image}
   */
  #create(type, ...args) {
    const image = this.#factory[type](...args)

    this.#images.push(image)

    return image
  }

  /**
   * Every image is probed at once, and what is missing is built concurrently: a build is
   * bound by the registry it uploads to, not by the runner, so one at a time leaves both idle.
   *
   * @param {boolean} push
   * @returns {Promise<void>}
   */
  async #run(push) {
    const existing = await Promise.all(
      this.#images.map((image) => this.exists(image.reference))
    )

    const missing = this.#images.filter((image, index) => {
      if (existing[index]) console.log('Image already exists, skipping:', image.reference)

      return !existing[index]
    })

    await pool(missing, (image) => this.#build(image, push))
  }

  /**
   * @param {toa.deployment.images.Image} image
   * @param {boolean} [push]
   * @returns {Promise<void>}
   */
  async #build(image, push = false) {
    const args = ['--context=default', 'buildx', 'build']

    if (push) args.push('--push')
    else args.push('--load')

    args.push('--tag', image.reference, image.context)

    if (this.#registry.build?.arguments !== undefined) {
      for (const arg of this.#registry.build.arguments)
        args.push('--build-arg', `${arg}=${process.env[arg]}`)
    }

    const platforms = this.#registry.platforms

    if (platforms !== null) args.push('--platform', platforms.join(','))

    // the container driver is what builds for a platform the runner is not; for a single
    // platform it costs a buildkit image to pull and buys nothing
    if (platforms !== null && platforms.length > 1) {
      args.push('--builder', await this.#ensureBuilder())

      // the driver that produces attestations is this one, and nothing reads them;
      // each is a manifest list to export and push per image
      args.push('--provenance=false')
    } else args.push('--builder', 'default')

    args.push('--progress', 'plain')

    await this.#process.execute('docker', args)
  }

  async exists(tag) {
    const args = ['manifest', 'inspect', tag]

    try {
      await this.#process.execute('docker', args, { silently: true })
    } catch (error) {
      console.log(error.message)

      return false
    }

    return true
  }

  /** @returns {Promise<string>} */
  #ensureBuilder() {
    // the promise is what is memoized, not its value: concurrent builds ask before any answers
    this.#builder ??= this.#createBuilder()

    return this.#builder
  }

  /** @returns {Promise<string>} */
  async #createBuilder() {
    try {
      await this.#process.execute('docker', ['buildx', 'inspect', BUILDER], {
        silently: true
      })
    } catch {
      await this.#process.execute('docker', [
        'buildx',
        'create',
        '--name',
        BUILDER,
        '--bootstrap'
      ])
    }

    return BUILDER
  }
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<void>} work
 * @returns {Promise<void>}
 */
async function pool(items, work) {
  const queue = items.slice()

  const workers = Array.from(
    { length: Math.min(CONCURRENCY, queue.length) },
    async () => {
      while (queue.length > 0) await work(queue.shift())
    }
  )

  await Promise.all(workers)
}

const BUILDER = 'toa'

/** How many builds run at once. Past this the uploads contend for the same uplink. */
const CONCURRENCY = 3
