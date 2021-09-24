'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  #domain
  #name
  #entity
  #bindings
  #operations
  #events

  constructor (manifest) {
    this.#domain = manifest.domain
    this.#name = manifest.name
    this.#entity = manifest.entity?.schema
    this.#bindings = manifest.bindings
    this.#operations = manifest.operations
    this.#events = manifest.events
  }

  get domain () {
    return this.#domain
  }

  get name () {
    return this.#name
  }

  get entity () {
    return this.#entity
  }

  get fqn () {
    return `${this.#domain}${concat('.', this.#name)}`
  }

  get operations () {
    return this.#operations
  }

  host (type) {
    return Locator.host(this.#domain, this.#name, type)
  }

  bindings (endpoint) {
    if (!endpoint) return this.#bindings

    return this.#operations[endpoint].bindings || this.#bindings
  }

  export () {
    return {
      domain: this.#domain,
      name: this.#name,
      entity: { schema: this.#entity },
      bindings: this.#bindings,
      operations: this.#operations,
      events: this.#events
    }
  }

  static split (locator) {
    const [domain, name, ...rest] = locator.split('.')

    return { domain, name, endpoint: rest.length > 0 ? rest.join('.') : undefined }
  }

  static host (domain, name, type) {
    return `${concat(name, '.')}${domain}.${concat(type && type.toLowerCase(), '.')}${TLD}`
  }
}

const TLD = 'local'

exports.Locator = Locator
