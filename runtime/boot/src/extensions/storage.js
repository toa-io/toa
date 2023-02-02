'use strict'

const { instances } = require('./instances')

/**
 * @param {toa.core.Storage} storage
 * @returns {toa.core.Storage}
 */
const storage = (storage) => {
  let decorated = storage

  for (const factory of Object.values(instances)) {
    if (factory.storage !== undefined) decorated = factory.storage(decorated)
  }

  return decorated
}

exports.storage = storage
