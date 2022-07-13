'use strict'

const { Connector } = require('./connector')

class Exposition extends Connector {
  locator

  #exposition

  constructor (locator, manifest) {
    super()

    this.locator = locator
    this.#exposition = expose(manifest)
  }

  async invoke () {
    return { output: this.#exposition }
  }
}

const expose = (manifest) => {
  const { namespace, name, operations, events } = manifest
  return { namespace, name, operations, events }
}

exports.Exposition = Exposition
