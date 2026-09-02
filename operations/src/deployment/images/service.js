import { join, dirname } from 'node:path'

import { Image } from './image.js'
import fs from 'fs-extra'

class Service extends Image {
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
  constructor (scope, runtime, registry, reference, service) {
    super(scope, runtime, registry)

    this.service = service.name

    this.#group = service.group
    this.#name = service.name
    this.#path = find(reference)
    this.#version = service.version
  }

  get name () {
    return 'extension-' + this.#group + '-' + this.#name
  }

  get version () {
    return this.#version
  }

  async prepare (root) {
    const context = await super.prepare(root)

    await fs.copy(this.#path, context)

    return context
  }
}

/**
 * @param {string} reference
 * @returns {string}
 */
const find = (reference) => {
  return dirname(require.resolve(join(reference, 'package.json')))
}

export { Service }
