'use strict'

const { Component } = require('./component')
const { Context } = require('./context')
const { Storage } = require('./storage')

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

  storage (storage) {
    return new Storage(storage)
  }
}

exports.Factory = Factory
