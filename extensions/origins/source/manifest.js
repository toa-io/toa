'use strict'

const schemas = require('./schemas')

/**
 * @param {toa.origins.Manifest} manifest
 * @returns {toa.origins.Manifest}
 */
function manifest (manifest) {
  schemas.manifest.validate(manifest)

  return manifest
}

exports.manifest = manifest
