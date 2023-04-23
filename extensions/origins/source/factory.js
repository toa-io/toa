'use strict'

const aspects = require('./aspects')
const { apply } = require('./env')

class Factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.origins.annotation.Component} declaration
   * @return {toa.core.extensions.Aspect[]}
   */
  aspect (locator, declaration) {
    apply(locator, declaration)

    return aspects.map((create) => create(declaration))
  }
}

exports.Factory = Factory
