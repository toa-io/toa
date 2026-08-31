'use strict'

const { join } = require('node:path')
const fs = require('fs-extra')
const { createHash } = require('node:crypto')

const { Image } = require('./image')

class Mono extends Image {
  dockerfile = join(__dirname, 'mono.Dockerfile')

  #image
  #components

  constructor (scope, runtime, registry, composition) {
    super(scope, runtime, registry)

    this.#image = composition.image
    this.#components = composition.components
  }

  get name () {
    return 'mono'
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
    if (this.#image !== undefined) return this.#image

    const images = new Set(this.#components.map((component) => component.build?.image))

    if (images.size > 1)
      throw new Error('Mono deployment requires different base images for its components. Specify base image for the composition in the context.')

    return images.values().next().value
  }

  get run () {
    const commands = []

    for (const component of this.#components) {
      const run = component.build?.run

      if (run !== undefined)
        commands.push(run)
    }

    return commands.join('\n')
  }

  async prepare (root) {
    const context = await super.prepare(root)

    for (const component of this.#components)
      await fs.copy(component.path, join(context, component.locator.label))

    return context
  }
}

exports.Mono = Mono
