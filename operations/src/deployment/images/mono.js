'use strict'

const { join } = require('node:path')
const fs = require('fs-extra')
const { createHash } = require('node:crypto')

const { Image } = require('./image')

class Mono extends Image {
  dockerfile = join(__dirname, 'mono.Dockerfile')

  #root
  #image
  #components

  constructor (scope, runtime, registry, composition, root) {
    super(scope, runtime, registry)

    this.#root = root
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
    let image = this.#image

    for (const component of this.#components) {
      const value = component.build?.image

      if (image !== null && image !== value)
        throw new Error('Mono deployment requires different base images for its components. Specify base image for the composition in the context.')

      image = value
    }

    return image
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

    await fs.copy(join(this.#root, CONTEXT), join(context, CONTEXT))
    await fs.ensureDir(join(context, 'components'))

    for (const component of this.#components)
      await fs.copy(component.path, join(context, 'components', component.locator.label))

    return context
  }
}

const CONTEXT = 'context.toa.yaml'

exports.Mono = Mono
