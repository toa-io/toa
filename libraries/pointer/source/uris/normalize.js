'use strict'

/**
 * @param {toa.pointer.URIs | string} declaration
 * @returns {toa.pointer.URIs}
 */
const normalize = (declaration) => {
  if (typeof declaration === 'string') return { default: declaration }
  return declaration
}

exports.normalize = normalize
