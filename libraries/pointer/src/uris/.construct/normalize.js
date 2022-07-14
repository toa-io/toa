'use strict'

/**
 * @param {toa.pointer.URIs | string} declaration
 * @returns {toa.pointer.URIs}
 */
const normalize = (declaration) => {
  /** @type {toa.pointer.URIs} */
  let annotation

  if (typeof declaration === 'string') annotation = { default: declaration }
  else annotation = declaration

  return annotation
}

exports.normalize = normalize
