'use strict'

/**
 * @param {toa.connectors.URIs | string} declaration
 * @returns {toa.connectors.URIs}
 */
const normalize = (declaration) => {
  /** @type {toa.connectors.URIs} */
  let annotation

  if (typeof declaration === 'string') annotation = { default: declaration }
  else annotation = declaration

  return annotation
}

exports.normalize = normalize
