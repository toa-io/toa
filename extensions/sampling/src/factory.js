'use strict'

const { Component } = require('./component')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  component (component) {
    return new Component(component)
  }
}

exports.Factory = Factory
