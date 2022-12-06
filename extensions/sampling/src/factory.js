'use strict'

const { Annex } = require('./annex')
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
    /** @type {toa.core.extensions.Annex[]} */
    const annexes = context.annexes.map(annex)

    return new Context(context, annexes)
  }

  storage (storage) {
    return new Storage(storage)
  }

  emitter (label, emitter) {
    return new Emitter(label, emitter)
  }
}

/**
 * @param {toa.core.extensions.Annex} annex
 * @returns {toa.core.extensions.Annex}
 */
const annex = (annex) => {
  return new Annex(annex)
}

exports.Factory = Factory
