'use strict'

const schemas = require('./schemas')
const protocols = require('./protocols')

/**
 * @param {toa.origins.Manifest} manifest
 * @returns {toa.origins.Manifest}
 */
function manifest (manifest) {
  if (manifest === null) return {}

  schemas.manifest.validate(manifest)

  for (const uri of Object.values(manifest)) {
    const protocol = new URL(uri).protocol
    const supported = protocols.find((provider) => provider.protocols.includes(protocol))

    if (supported === undefined) throw new Error(`'${protocol}' protocol is not supported`)
  }

  return manifest
}

exports.manifest = manifest
