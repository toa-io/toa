'use strict'

const { instances } = require('./instances')

/**
 * @param {toa.core.bindings.Emitter} emitter
 * @param {string} label
 * @param {toa.core.Locator} locator
 * @returns {toa.core.bindings.Emitter}
 */
const emitter = (emitter, label, locator) => {
  let decorated = emitter

  for (const factory of Object.values(instances)) {
    if (factory.emitter !== undefined) decorated = factory.emitter(decorated, label, locator)
  }

  return decorated
}

exports.emitter = emitter
