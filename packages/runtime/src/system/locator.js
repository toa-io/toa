'use strict'

const { Locator: Base } = require('../locator')

class Locator extends Base {
  constructor (locator, endpoints) {
    super(locator.domain, locator.name, endpoints)
  }

  host (type) {
    return Base.host('system', null, type)
  }
}

exports.Locator = Locator
