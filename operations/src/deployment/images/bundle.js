import { basename, join } from 'node:path'
import { cp } from 'node:fs/promises'
import { createHash } from 'node:crypto'

import { Image } from './image.js'
import { Dependencies } from './dependencies.js'
import { declare } from './format.js'

/**
 * Components in one image: their sources laid over their dependencies, which are an image
 * of their own (see `Dependencies`). What is built here is the sources layer alone.
 *
 * @implements {toa.deployment.images.Bundle}
 * @abstract
 */
export class Bundle extends Image {
  /** @type {Dependencies} */
  dependencies

  /** @type {string | undefined} */
  image

  /** @type {toa.norm.Component[]} */
  components

  /** What the services this workload runs install, which no component of it declares.
   *  @type {Record<string, string> | undefined} */
  packages

  constructor(scope, runtime, registry, composition) {
    super(scope, runtime, registry)

    this.image = composition.image
    this.components = composition.components
    this.packages = composition.packages
    this.dependencies = new Dependencies(scope, runtime, registry, this)
  }

  tag() {
    this.dependencies.tag()
    super.tag()
  }

  get version() {
    const hash = createHash('sha256')

    for (const component of this.components) {
      hash.update(component.locator.id)
      hash.update(component.version)
    }

    // laid over a different base is a different image, whatever the sources
    hash.update(this.dependencies.version)

    return hash.digest('hex').slice(0, 8)
  }

  get base() {
    return this.dependencies.reference
  }

  /**
   * What to say when the components ask for different base images.
   *
   * @abstract
   * @returns {string}
   */
  conflict() {
    throw new Error('Not implemented')
  }

  async prepare(root) {
    const context = await super.prepare(root)

    for (const component of this.components) {
      const target = join(context, component.locator.label)

      // what was installed in the workspace is not what the image installs
      await cp(component.path, target, { recursive: true, filter: sources })
      await declare(component.path, target, component.locator.label)
    }

    return context
  }
}

const sources = (path) => basename(path) !== 'node_modules'
