'use strict'

/**
 * @param {toa.annotations.URIs | string} declaration
 * @returns {toa.annotations.URIs}
 */
const normalize = (declaration) => {
  /** @type {toa.annotations.URIs} */
  let annotation

  if (typeof declaration === 'string') annotation = { default: declaration }
  else annotation = declaration

  return annotation
}

exports.normalize = normalize
