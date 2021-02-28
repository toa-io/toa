'use strict'

class Locator {
  domain
  forename

  get name () {
    return `${(this.domain ? `${this.domain}.` : '')}${this.forename}`
  }

  get path () {
    return `/${this.domain ? `${this.domain}/` : ''}${this.forename}`
  }

  endpoint (name) {
    return `${this.name}.${name}`
  }
}

exports.Locator = Locator
