'use strict'

const { instances } = require('./instances')

/**
 * @param {toa.core.bindings.Emitter} emitter
 * @param {string} label
 * @returns {toa.core.bindings.Emitter}
 */
const emitter = (emitter, label) => {
  let decorated = emitter

  for (const factory of Object.values(instances)) {
    if (factory.emitter !== undefined) decorated = factory.emitter(decorated, label)
  }

  return decorated
}

exports.emitter = emitter
