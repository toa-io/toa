'use strict'

const { Composition } = require('./composition')

/**
 * @implements {toa.operations.deployment.images.Registry}
 */
class Registry {
  /** @type {toa.formation.context.Context} */
  #context
  /** @type {toa.operations.Process} */
  #process
  /** @type {Array<toa.operations.deployment.images.Image>} */
  #images = []

  /**
   * @param context {toa.formation.context.Context}
   * @param process {toa.operations.Process}
   */
  constructor (context, process) {
    this.#context = context
    this.#process = process
  }

  composition (composition) {
    /** @type {import('./image').Image} */
    const image = new Composition(this.#context.runtime, this.#process, composition)

    image.tag(this.#context.registry)
    this.#images.push(image)

    return image
  }

  async prepare (target) {
    await Promise.all(this.#images.map((image) => image.prepare(target)))
  }

  async push () {
    await Promise.all(this.#images.map((image) => image.build().then(() => image.push())))
  }
}

exports.Registry = Registry
