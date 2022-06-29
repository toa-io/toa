'use strict'

const { Connector } = require('./connector')

class Exposition extends Connector {
  locator

  #manifest

  constructor (locator, manifest) {
    super()

    this.locator = locator

    this.#manifest = expose(manifest)
  }

  async invoke () {
    return { output: this.#manifest }
  }
}

const expose = (manifest) => {
  const { namespace, name, operations, events } = manifest
  return { namespace, name, operations, events }
}

exports.Exposition = Exposition
