'use strict'

class Exposition {
  locator

  #manifest

  constructor (locator, manifest) {
    this.locator = locator

    this.#manifest = Exposition.#expose(manifest)
  }

  async invoke () {
    return { output: this.#manifest }
  }

  static #expose (manifest) {
    const { domain, name, operations, events } = manifest
    return { domain, name, operations, events }
  }
}

exports.Exposition = Exposition
