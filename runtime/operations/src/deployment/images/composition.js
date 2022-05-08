'use strict'

const { join } = require('node:path')
const { hash } = require('@toa.io/gears')

const { copy } = require('../../util/copy')
const { Image } = require('./image')

class Composition extends Image {
  dockerfile = join(__dirname, 'composition.Dockerfile')

  /** @type {toa.formation.context.Runtime} */
  #runtime
  /** @type {toa.operations.Process} */
  #process
  /** @type {string} */
  #name
  /** @type {Array<toa.formation.component.Component>} */
  #components

  /**
   * @param runtime {toa.formation.context.Runtime}
   * @param process {toa.operations.Process}
   * @param composition {toa.formation.context.Composition}
   */
  constructor (runtime, process, composition) {
    super(runtime, process)

    this.#runtime = runtime
    this.#process = process
    this.#name = composition.name
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
