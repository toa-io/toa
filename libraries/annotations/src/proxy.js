'use strict'

const { normalize, validate } = require('./.proxy')

/**
 * @param {toa.libraries.annotations.proxy.Proxy | string} declaration
 * @return {toa.libraries.annotations.Proxy}
 */
const proxy = (declaration) => {
  const normalized = normalize(declaration)

  validate(normalized)

  return normalized
}

exports.proxy = proxy
