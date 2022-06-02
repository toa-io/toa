'use strict'

const { join } = require('node:path')
const { hash, directory: { copy } } = require('@toa.io/gears')

const { Image } = require('./image')

class Composition extends Image {
  dockerfile = join(__dirname, 'composition.Dockerfile')

  /** @type {string} */
  #name
  /** @type {Array<toa.formation.Component>} */
  #components

  /**
   * @param scope {string}
   * @param runtime {toa.formation.context.Runtime}
   * @param composition {toa.formation.context.Composition}
   */
  constructor (scope, runtime, composition) {
    super(scope, runtime)

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
