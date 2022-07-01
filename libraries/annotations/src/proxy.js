'use strict'

const { normalize, validate } = require('./.proxy')

const proxy = (declaration) => {
  const normalized = normalize(declaration)

  validate(normalized)

  return normalized
}

exports.proxy = proxy
