'use strict'

const { uris } = require('@toa.io/pointer')

/**
 * @param {toa.pointer.URIs} declaration
 * @returns {toa.pointer.URIs}
 */
function manifest (declaration) {
  uris.validate(declaration)

  return declaration
}

exports.manifest = manifest
