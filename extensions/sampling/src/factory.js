'use strict'

const { Aspect } = require('./aspect')
const { Component } = require('./component')
const { Context } = require('./context')
const { Storage } = require('./storage')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')

/**
 * @implements {toa.core.extensions.Factory}
 */
class Factory {
  component (component) {
    return new Component(component)
  }

  context (context) {
    /** @type {toa.core.extensions.Aspect[]} */
    const aspects = context.aspects.map(aspect)

    return new Context(context, aspects)
  }

  storage (storage) {
    return new Storage(storage)
  }

  emitter (emitter, label) {
    return new Emitter(emitter, label)
  }

  receiver (receiver, locator) {
    return new Receiver(receiver, locator)
  }
}

/**
 * @param {toa.core.extensions.Aspect} aspect
 * @returns {toa.core.extensions.Aspect}
 */
const aspect = (aspect) => new Aspect(aspect)

exports.Factory = Factory
