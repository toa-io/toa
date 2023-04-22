'use strict'

const { override } = require('./env')
const { Aspect } = require('./aspect')

class Factory {
  /**
   * @param {toa.core.Locator} locator
   * @param {toa.origins.annotation.Component} declaration
   * @return {Aspect}
   */
  aspect (locator, declaration) {
    override(locator, declaration)

    return new Aspect(declaration)
  }
}

exports.Factory = Factory
