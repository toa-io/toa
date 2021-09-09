'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  #domain
  #name
  #endpoints

  constructor (domain, name = null, endpoints = []) {
    this.#domain = domain
    this.#name = name
    this.#endpoints = endpoints
  }

  get domain () {
    return this.#domain
  }

  get name () {
    return this.#name
  }

  get fqn () {
    return `${this.#domain}${concat('.', this.#name)}`
  }

  get endpoints () {
    return this.#endpoints
  }

  host (type) {
    return Locator.host(this.#domain, this.#name, type)
  }

  endpoint (name) {
    return this.fqn + '.' + name
  }

  export () {
    return {
      domain: this.#domain,
      name: this.#name,
      endpoints: this.#endpoints
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
