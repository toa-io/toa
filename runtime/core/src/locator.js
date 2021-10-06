'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  domain = 'system'
  name
  id

  constructor (manifest) {
    if (manifest !== undefined) {
      if (typeof manifest === 'string') {
        manifest = Locator.parse(manifest)
      }

      this.domain = manifest.domain
      this.name = manifest.name
    }

    this.id = `${this.domain}${concat('.', this.name)}`
  }

  host (type) {
    return `${concat(this.name, '.')}${this.domain}.${type === undefined ? '' : concat(type.toLowerCase(), '.')}${TLD}`
  }

  static parse (label) {
    const [domain, name, ...rest] = label.split('.')

    return { domain, name, endpoint: rest.join('.') }
  }
}

const TLD = 'local'

exports.Locator = Locator
