'use strict'

const { normalize, validate } = require('./.construct')

/**
 * @param {toa.pointer.URIs} declaration
 * @returns {toa.pointer.URIs}
 */
const construct = (declaration) => {
  const normalized = normalize(declaration)

  validate(normalized)

  return normalized
}

exports.construct = construct
