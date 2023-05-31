'use strict'

const { join } = require('node:path')
const { hash } = require('@toa.io/generic')
const { directory: { copy } } = require('@toa.io/filesystem')

const { Image } = require('./image')

class Composition extends Image {
  dockerfile = join(__dirname, 'composition.Dockerfile')

  /** @type {string} */
  #name

  /** @type {toa.norm.Component[]} */
  #components

  /**
   * @param {string} scope
   * @param {toa.norm.context.Runtime} runtime
   * @param {toa.norm.context.Registry} registry
   * @param {toa.norm.context.Composition} composition
   */
  constructor (scope, runtime, registry, composition) {
    super(scope, runtime, registry)

    this.#name = composition.name
    this.#components = composition.components
  }

  get name () {
    return this.#name
  }

  get version () {
    const tags = this.#components.map((component) => component.locator.id + ':' + component.version)

    return hash(tags.join(';'))
  }

  async prepare (root) {
    const context = await super.prepare(root)

    for (const component of this.#components) {
      await copy(component.path, join(context, component.locator.label))
    }

    return context
  }
}

exports.Composition = Composition
