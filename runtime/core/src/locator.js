'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  domain = 'system'
  name
  id

  constructor (manifest) {
    if (manifest !== undefined) {
      this.domain = manifest.domain
      this.name = manifest.name
    }

    this.id = `${this.domain}${concat('.', this.name)}`
  }

  host (type) {
    return `${concat(this.name, '.')}${this.domain}.${type === undefined ? '' : concat(type.toLowerCase(), '.')}${TLD}`
  }
}

const TLD = 'local'

exports.Locator = Locator
