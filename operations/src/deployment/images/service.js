import { createRequire } from 'node:module'
import { join, dirname } from 'node:path'
import { existsSync, readdirSync, readFileSync } from 'node:fs'

import { Image } from './image.js'
import { cp, writeFile } from 'node:fs/promises'

// a service is named the way a package is, and its directory is where it lives
const require = createRequire(import.meta.url)

export class Service extends Image {
  dockerfile = join(import.meta.dirname, 'service.Dockerfile')

  /**
   * Used by Dockerfile
   *
   * @readonly
   * @type {string}
   * */
  service

  /** @type {string} */
  #group

  /** @type {string} */
  #name

  /** @type {string} */
  #path

  /** @type {string} */
  #version

  /**
   * @param {string} scope
   * @param {toa.norm.context.Runtime} runtime
   * @param {toa.norm.context.Registry} registry
   * @param {string} reference
   * @param {toa.deployment.dependency.Service} service
   */
  constructor(scope, runtime, registry, reference, service) {
    super(scope, runtime, registry)

    this.service = service.name

    this.#group = service.group
    this.#name = service.name
    this.#path = find(reference)
    this.#version = service.version
  }

  get name() {
    return 'extension-' + this.#group + '-' + this.#name
  }

  get version() {
    return this.#version
  }

  async prepare(root) {
    const context = await super.prepare(root)

    await cp(this.#path, context, { recursive: true })
    await writeFile(join(context, PACKAGES), this.#packages().join('\n'))

    return context
  }

  /**
   * What the components this service runs declare, as `name@version`.
   *
   * Each is installed beside its component, where the component's own modules import it, and
   * beside Toa, where an extension that imports on a component's behalf is — a storage
   * provider's SDK is imported by `@toa.io/extensions.storages`, not by the component that
   * declares the storage.
   *
   * @returns {string[]}
   */
  #packages() {
    const directory = join(this.#path, 'components')

    if (!existsSync(directory)) return []

    /** @type {Record<string, string>} */
    const packages = {}

    for (const label of readdirSync(directory)) {
      const manifest = join(directory, label, 'package.json')

      if (!existsSync(manifest)) continue

      Object.assign(packages, JSON.parse(readFileSync(manifest, 'utf8')).dependencies)
    }

    return Object.entries(packages)
      .map(([name, version]) => `${name}@${version}`)
      .sort()
  }
}

/** Where the install reads what the components need, one `name@version` per line. */
const PACKAGES = '.packages'

/**
 * Where the extension is installed, which is what its image is built from. A deploy install
 * carries what an extension declares and not the extension, so a service is built only where
 * the runtime is installed beside the deployment library; elsewhere its image is published.
 *
 * @param {string} reference
 * @returns {string}
 */
const find = (reference) => {
  try {
    return dirname(require.resolve(join(reference, 'package.json')))
  } catch (error) {
    throw new Error(
      `'${reference}' is not installed, and \`registry.services: build\` builds its image ` +
        'from where it is: install the runtime beside @toa.io/operations, or take the ' +
        'image the release publishes with `registry.services: published`',
      { cause: error }
    )
  }
}
