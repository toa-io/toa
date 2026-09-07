import { basename, join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

import { Image } from './image.js'

/**
 * What a bundle's components depend on, installed on the base: the layers that weigh the
 * most and change the least, so they are an image of their own. Its tag digests everything
 * the install reads, and nothing else: a change to the sources leaves it where it is, and a
 * bundle is laid over it without building or moving it again.
 *
 * @implements {toa.deployment.images.Image}
 */
export class Dependencies extends Image {
  dockerfile = join(import.meta.dirname, 'dependencies.Dockerfile')
  arguments = true

  /** @type {toa.deployment.images.Bundle} */
  #owner

  #runtime
  #registry

  /** @type {string | undefined} */
  #version

  /**
   * @param {string} scope
   * @param {toa.norm.context.Runtime} runtime
   * @param {toa.norm.context.Registry} registry
   * @param {toa.deployment.images.Bundle} owner the bundle laid over this image
   */
  constructor(scope, runtime, registry, owner) {
    super(scope, runtime, registry)

    this.#owner = owner
    this.#runtime = runtime
    this.#registry = registry
  }

  /** Same repository as the bundle: a tag apart, not a name apart. */
  get name() {
    return this.#owner.name
  }

  get version() {
    if (this.#version !== undefined) return this.#version

    const hash = createHash('sha256')
    const build = this.#registry.build ?? {}

    const inputs = [
      this.#runtime.version,
      this.#runtime.registry,
      this.#runtime.proxy,
      this.base,
      build.image,
      build.run,
      this.run,
      ...(build.arguments ?? [])
    ]

    for (const input of inputs) hash.update(input ?? '').update('\0')

    for (const [label, files] of this.#manifests())
      for (const file of files)
        hash.update(label).update(basename(file)).update(readFileSync(file))

    hash.update(this.#packages().join('\n'))

    this.#version = hash.digest('hex').slice(0, 8)

    return this.#version
  }

  digest() {
    return PREFIX + this.version
  }

  get base() {
    if (this.#owner.image !== undefined) return this.#owner.image

    const images = new Set(
      this.#owner.components.map((component) => component.build?.image)
    )

    if (images.size > 1) throw new Error(this.#owner.conflict())

    return images.values().next().value
  }

  get run() {
    const commands = []

    for (const component of this.#owner.components) {
      const run = component.build?.run

      if (run !== undefined) commands.push(run)
    }

    return commands.join('\n')
  }

  async prepare(root) {
    const context = await super.prepare(join(root, DIRECTORY))

    for (const [label, files] of this.#manifests()) {
      const target = join(context, label)

      await mkdir(target, { recursive: true })

      for (const file of files) await copyFile(file, join(target, basename(file)))
    }

    const packages = this.#packages()

    // written whether or not there are any, so the file is one thing the Dockerfile reads
    await writeFile(join(context, PACKAGES), packages.join('\n'))

    return context
  }

  /**
   * What the extensions install for what these components declare, as `name@version`. A
   * component states its own dependencies in its manifest; this is what the packages that
   * read its declaration need, which its manifest has no way to say.
   *
   * @returns {string[]}
   */
  #packages() {
    /** @type {Record<string, string>} */
    const packages = {}

    for (const component of this.#owner.components)
      Object.assign(packages, component.packages)

    return Object.entries(packages)
      .map(([name, version]) => `${name}@${version}`)
      .sort()
  }

  /**
   * The files the install reads, by component label, in a fixed order.
   *
   * @returns {Array<[string, string[]]>}
   */
  #manifests() {
    const manifests = []

    for (const component of this.#owner.components) {
      const files = MANIFESTS.map((name) => join(component.path, name)).filter(existsSync)

      if (files.length > 0) manifests.push([component.locator.label, files])
    }

    return manifests.sort(([a], [b]) => a.localeCompare(b))
  }
}

const PREFIX = 'deps-'

/** Where the contexts land, apart from the bundles', whose names they share. */
const DIRECTORY = 'dependencies'

const MANIFESTS = ['package.json', 'package-lock.json']

/** Where the install reads what the extensions need, one `name@version` per line. */
const PACKAGES = '.packages'
