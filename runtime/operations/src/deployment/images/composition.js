'use strict'

const { join } = require('node:path')
const { hash } = require('@toa.io/gears')

const { copy } = require('../../util/copy')
const { Image } = require('./image')

class Composition extends Image {
  dockerfile = join(__dirname, 'composition.Dockerfile')

  /** @type {toa.formation.context.Runtime} */
  #runtime
  /** @type {string} */
  #name
  /** @type {Array<toa.formation.component.Component>} */
  #components

  /**
   * @param scope {string}
   * @param runtime {toa.formation.context.Runtime}
   * @param composition {toa.formation.context.Composition}
   */
  constructor (scope, runtime, composition) {
    super(scope, runtime)

    this.#name = composition.name
    this.#runtime = runtime
    this.#components = composition.components
  }

  /**
   * @protected
   * @returns {string}
   */
  get key () {
    const components = this.#components.map((component) => component.locator.id + ':' + component.version)
    const tag = [this.#runtime.version, ...components].join(';')

    return hash(tag)
  }

  /**
   * @protected
   * @returns {string}
   */
  get name () {
    return this.#name
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
