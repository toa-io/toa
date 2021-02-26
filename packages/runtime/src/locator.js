'use strict'

class Locator {
  domain
  forename

  get name () {
    return `${(this.domain ? `${this.domain}.` : '')}${this.forename}`
  }
}

exports.Locator = Locator
