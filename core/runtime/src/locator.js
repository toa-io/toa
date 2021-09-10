'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  #domain
  #name
  #entity
  #bindings
  #operations

  constructor (manifest) {
    this.#domain = manifest.domain
    this.#name = manifest.name
    this.#entity = manifest.entity
    this.#bindings = manifest.bindings
    this.#operations = manifest.operations
  }

  get domain () {
    return this.#domain
  }

  get name () {
    return this.#name
  }

  get entity () {
    return this.#entity?.schema
  }

  get fqn () {
    return `${this.#domain}${concat('.', this.#name)}`
  }

  get operations () {
    return this.#operations.map((operation) => ({ ...operation, bindings: operation.bindings || this.#bindings }))
  }

  host (type) {
    return Locator.host(this.#domain, this.#name, type)
  }

  endpoint (endpoint) {
    return this.fqn + '.' + endpoint
  }

  bindings (endpoint) {
    if (!endpoint) return this.#bindings

    const operation = this.#operations.find((operation) => operation.name === endpoint)

    return operation.bindings || this.#bindings
  }

  export () {
    return {
      domain: this.#domain,
      name: this.#name,
      entity: this.#entity,
      bindings: this.#bindings,
      operations: this.#operations
    }
  }

  static split (fqn) {
    const [domain, name, endpoint] = fqn.split('.')

    return { domain, name, endpoint }
  }

  static host (domain, name, type) {
    return `${concat(name, '.')}${domain}.${concat(type && type.toLowerCase(), '.')}${TLD}`
  }
}

const TLD = 'local'

exports.Locator = Locator
