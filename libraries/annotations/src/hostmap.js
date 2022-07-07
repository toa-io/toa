'use strict'

const { normalize, validate } = require('./.hostmap')

/** @type {toa.annotations.hostmap.Constructor} */
const hostmap = (declaration) => {
  const normalized = normalize(declaration)

  validate(normalized)

  return normalized
}

exports.hostmap = hostmap
