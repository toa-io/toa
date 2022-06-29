'use strict'

const { normalize, validate } = require('./.proxy')

/**
 * @param {toa.annotations.proxy.Proxy | string} declaration
 * @return {toa.annotations.Proxy}
 */
const proxy = (declaration) => {
  const normalized = normalize(declaration)

  validate(normalized)

  return normalized
}

exports.proxy = proxy
