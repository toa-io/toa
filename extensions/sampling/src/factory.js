'use strict'

const { Aspect } = require('./aspect')
const { Component } = require('./component')
const { Context } = require('./context')
const { Storage } = require('./storage')
const { Emitter } = require('./emitter')

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

  emitter (label, emitter) {
    return new Emitter(label, emitter)
  }
}

/**
 * @param {toa.core.extensions.Aspect} aspect
 * @returns {toa.core.extensions.Aspect}
 */
const aspect = (aspect) => {
  return new Aspect(aspect)
}

exports.Factory = Factory
