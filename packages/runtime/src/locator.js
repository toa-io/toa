'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  #domain
  #entity
  #endpoints

  constructor (domain, entity = null, endpoints = []) {
    this.#domain = domain
    this.#entity = entity
    this.#endpoints = endpoints
  }

  get domain () {
    return this.#domain
  }

  get entity () {
    return this.#entity
  }

  get name () {
    return `${this.#domain}${concat('.', this.#entity)}`
  }

  host (type) {
    return `${concat(this.#entity, '.')}${this.#domain}.${type.toLowerCase()}.${TLD}`
  }

  get endpoints () {
    return this.#endpoints
  }
}

const TLD = 'local'

exports.Locator = Locator
