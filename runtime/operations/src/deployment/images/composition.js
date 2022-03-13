'use strict'

const { join } = require('node:path')
const { hash } = require('@toa.io/gears')
const { Image } = require('./image')
const { copy } = require('../../util/copy')

class Composition extends Image {
  dockerfile = join(__dirname, '../assets/Dockerfile.composition')

  #composition
  #runtime

  constructor (context, process, composition) {
    super(context, process)

    this.#runtime = context.runtime
    this.#composition = composition
  }

  async export (root) {
    const context = await super.export(root)

    for (const component of this.#composition.components) {
      await copy(component.path, join(context, component.locator.label))
    }
  }

  get name () {
    return this.#composition.name
  }

  get key () {
    const components = this.#composition.components.map((component) => component.locator.id + ':' + component.version)
    const tag = [this.#runtime.version, ...components].join(';')

    return hash(tag)
  }
}

exports.Composition = Composition
