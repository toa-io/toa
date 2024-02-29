'use strict'

const { join } = require('node:path')
const fs = require('fs-extra')
const { createHash } = require('node:crypto')

const { Image } = require('./image')

class Composition extends Image {
  dockerfile = join(__dirname, 'composition.Dockerfile')

  #name
  #image
  #components

  constructor (scope, runtime, registry, composition) {
    super(scope, runtime, registry)

    this.#name = composition.name
    this.#image = composition.image
    this.#components = composition.components
  }

  get name () {
    return 'composition-' + this.#name
  }

  get version () {
    const hash = createHash('sha256')

    for (const component of this.#components) {
      hash.update(component.locator.id)
      hash.update(component.version)
    }

    return hash.digest('hex').slice(0, 8)
  }

  get base () {
    if (this.#image !== undefined) {
      return this.#image
    }

    let image = null

    for (const component of this.#components) {
      const value = component.build?.image

      if (image !== null && image !== value) {
        throw new Error(`Composition '${this.#name}' requires different base images for its components. Specify base image for the composition in the context.`)
      }

      image = value
    }

    return image ?? undefined
  }

  async prepare (root) {
    const context = await super.prepare(root)

    for (const component of this.#components) {
      await fs.copy(component.path, join(context, component.locator.label))
    }

    return context
  }
}

exports.Composition = Composition
