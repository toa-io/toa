'use strict'

const { normalize } = require('./normalize')
const { validate } = require('./validate')

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
