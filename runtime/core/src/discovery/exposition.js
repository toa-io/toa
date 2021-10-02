'use strict'

const { endpoints } = require('./interface')

class Exposition {
  locator
  endpoints

  #manifest

  constructor (locator, manifest) {
    this.locator = locator
    this.endpoints = endpoints(manifest.domain, manifest.name)

    this.#manifest = Exposition.#expose(manifest)
  }

  lookup () {
    return this.#manifest
  }

  async invoke (endpoint, input) {
    const method = endpoint.split('.')[2]
    return { output: this[method](input) }
  }

  static #expose (manifest) {
    const { domain, name, entity, operations, events } = manifest
    return { domain, name, entity: entity.schema, operations, events }
  }
}

exports.Exposition = Exposition
