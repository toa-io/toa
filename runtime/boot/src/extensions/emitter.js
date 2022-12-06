'use strict'

const { instances } = require('./instances')

/**
 * @param {toa.core.bindings.Emitter} emitter
 * @returns {toa.core.bindings.Emitter}
 */
const emitter = (label, emitter) => {
  let decorated = emitter

  for (const factory of Object.values(instances)) {
    if (factory.emitter !== undefined) decorated = factory.emitter(label, decorated)
  }

  return decorated
}

exports.emitter = emitter
