'use strict'

const { Component } = require('./component')
const { Context } = require('./context')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  component (component) {
    return new Component(component)
  }

  context (context) {
    return new Context(context)
  }
}

exports.Factory = Factory
