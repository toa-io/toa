'use strict'

const { normalize, validate } = require('./.annotations')

/**
 * @param {toa.storages.mongo.Annotations | string} declaration
 * @returns {toa.storages.mongo.Annotations}
 */
const annotations = (declaration) => {
  declaration = normalize(declaration)

  validate(declaration)

  return declaration
}

exports.annotations = annotations
