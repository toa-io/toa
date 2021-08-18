'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  #domain
  #entity

  constructor (domain, entity = null) {
    if (typeof domain !== 'string') { throw new Error('Domain must be defined') }

    this.#domain = domain
    this.#entity = entity
  }

  get domain () { return this.#domain }
  get entity () { return this.#entity }
  get name () { return `${this.#domain}${concat('.', this.#entity)}` }

  host (type) {
    type = type.toLowerCase()

    return `${concat(this.#entity, '.')}${this.#domain}.${type}.${TLD}`
  }
}

const TLD = 'local'

exports.Locator = Locator
