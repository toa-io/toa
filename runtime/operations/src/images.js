'use strict'

const { Image } = require('./images/image')

class Images {
  #images

  constructor (context) {
    this.#images = context.manifests.map((manifest) => new Image(manifest, context.registry))
  }

  async push () {
    await this.#build()
    await this.#push()
  }

  async #build () {
    await Promise.all(this.#images.map((image) => image.build()))
  }

  async #push () {
    await Promise.all(this.#images.map((image) => image.push()))
  }
}

exports.Images = Images
