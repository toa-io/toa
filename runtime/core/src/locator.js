'use strict'

const { concat } = require('@toa.io/gears')

class Locator {
  domain = 'system'
  name
  id
  label

  constructor (manifest) {
    if (manifest !== undefined) {
      if (typeof manifest === 'string') {
        manifest = Locator.parse(manifest)
      }

      this.domain = manifest.domain
      this.name = manifest.name
    }

    this.id = `${this.domain}${concat('.', this.name)}`
    this.label = `${this.domain}${concat('-', this.name)}`
  }

  host (type, level = 0) {
    let host = ''

    const segments = LEVELS.slice(0, level + 1)

    for (const segment of segments) {
      host += concat(segment(this), '-')
    }

    if (type) host += type.toLowerCase()

    return host
  }

  static parse (label) {
    const [domain, name, ...rest] = label.split('.')

    return { domain, name, endpoint: rest.join('.') }
  }
}

const LEVELS = [
  (locator) => locator.domain,
  (locator) => locator.name
]

exports.Locator = Locator
