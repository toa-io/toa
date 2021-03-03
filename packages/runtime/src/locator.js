'use strict'

const { concat } = require('@kookaburra/gears')

class Locator {
  domain
  forename

  get name () {
    return `${concat(this.domain, '.')}${this.forename}`
  }

  get path () {
    return `/${concat(this.domain, '/')}${this.forename}`
  }

  endpoint (name) {
    return `${this.name}.${name}`
  }
}

exports.Locator = Locator
