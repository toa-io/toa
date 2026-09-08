import * as workspace from './workspace.js'

/**
 * @implements {toa.deployment.Registry}
 */
export class Registry {
  #registry

  #factory

  #process

  /** @type {toa.deployment.images.Image[]} */
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

    await Promise.all(this.#all().map((image) => image.prepare(path)))

    return path
  }

  async build() {
    await this.#run(false)
  }

  async push() {
    await this.#run(true)
  }

  /**
   * A second tag on each workload image, the environment, so a retention job can see what
   * a deploy left running. `deps-*` is not in `#images`.
   *
   * @param {string} [environment]
   * @returns {Promise<void>}
   */
  async alias(environment) {
    if (
      typeof environment !== 'string' ||
      environment === '' ||
      CONTENT_TAG.test(environment)
    )
      return

    await Promise.all(this.#images.map((image) => this.#alias(image, environment)))
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
   * Every image and what it is laid over.
   *
   * @returns {toa.deployment.images.Image[]}
   */
  #all() {
    return this.#images.flatMap((image) =>
      image.dependencies === undefined ? [image] : [image.dependencies, image]
    )
  }

  /**
   * Every image is probed at once, and what is missing is prepared and built concurrently:
   * a build is bound by the registry it uploads to, not by the runner, so one at a time
   * leaves both idle. What an image is laid over is built before it.
   *
   * @param {boolean} push
   * @returns {Promise<void>}
   */
  async #run(push) {
    // a push builds on the container driver, whose bootstrap is spent while the probes are out
    if (push) this.#ensureBuilder().catch(() => undefined)

    const images = this.#all()

    const existing = await Promise.all(
      images.map((image) => this.exists(image.reference))
    )

    const missing = images.filter((image, index) => {
      if (existing[index]) console.log('Image already exists, skipping:', image.reference)

      return !existing[index]
    })

    if (missing.length === 0) return

    const path = await workspace.create('images')

    await Promise.all(missing.map((image) => image.prepare(path)))

    const bases = new Set(this.#images.map((image) => image.dependencies))
    const build = (image) => this.#build(image, push)

    await pool(
      missing.filter((image) => bases.has(image)),
      build
    )
    await pool(
      missing.filter((image) => !bases.has(image)),
      build
    )
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

    if (image.arguments && this.#registry.build?.arguments !== undefined) {
      for (const arg of this.#registry.build.arguments)
        args.push('--build-arg', `${arg}=${process.env[arg]}`)
    }

    const platforms = this.#registry.platforms

    if (platforms !== null) args.push('--platform', platforms.join(','))

    // a push takes the container driver: its registry exporter is what lays an image over a
    // base it never pulled. A load takes the daemon's own, unless it builds for a platform
    // the runner is not, which the daemon's cannot
    if (push || (platforms !== null && platforms.length > 1)) {
      args.push('--builder', await this.#ensureBuilder())

      // the driver that produces attestations is this one, and nothing reads them;
      // each is a manifest list to export and push per image
      args.push('--provenance=false')
    } else args.push('--builder', 'default')

    args.push('--progress', 'plain')

    await this.#process.execute('docker', args)
  }

  /**
   * @param {toa.deployment.images.Image} image
   * @param {string} environment
   * @returns {Promise<void>}
   */
  async #alias(image, environment) {
    const target = retag(image.reference, environment)
    const args = ['buildx', 'imagetools', 'create', '--tag', target]

    if (LOCAL.test(image.reference)) args.push('--insecure')

    args.push(image.reference)

    await this.#process.execute('docker', args)
  }

  async exists(tag) {
    const args = ['manifest', 'inspect']

    // a registry on this machine speaks plain HTTP, which the probe has to be told
    if (LOCAL.test(tag)) args.push('--insecure')

    args.push(tag)

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
      // on the host's network, a registry the host reaches as `localhost` is reached
      await this.#process.execute('docker', [
        'buildx',
        'create',
        '--name',
        BUILDER,
        '--driver',
        'docker-container',
        '--driver-opt',
        'network=host',
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

/**
 * @param {string} reference
 * @param {string} tag
 * @returns {string}
 */
function retag(reference, tag) {
  return reference.slice(0, reference.lastIndexOf(':') + 1) + tag
}

const BUILDER = 'toa'

/** An environment named this way is a content tag, and must not be moved as one. */
const CONTENT_TAG = /^(deps-)?[0-9a-f]{8}$/

/** A reference into a registry on this machine, by any of the names it goes by. */
const LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|host\.docker\.internal)(:\d+)?\//

/** How many builds run at once. Past this the uploads contend for the same uplink. */
const CONCURRENCY = 3
