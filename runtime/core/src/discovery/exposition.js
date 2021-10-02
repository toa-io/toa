'use strict'

class Exposition {
  locator
  endpoints

  #manifest

  constructor (locator, manifest) {
    this.locator = locator

    this.endpoints = Exposition.endpoints.map((endpoint) =>
      manifest.domain + '.' + manifest.name + '.' + endpoint)

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

  static endpoints = ['lookup']
}

exports.Exposition = Exposition
