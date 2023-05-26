'use strict'

const { remap, echo, shards } = require('@toa.io/generic')
const schemas = require('./schemas')
const protocols = require('./protocols')
const credentials = require('./.credentials')

/**
 * @param {toa.origins.Manifest} manifest
 * @returns {toa.origins.Manifest}
 */
function manifest (manifest) {
  if (manifest === null) return {}

  manifest = remap(manifest, (origin) => echo(origin))
  validate(manifest)

  for (const url of Object.values(manifest)) {
    const supported = protocols.find((provider) => supports(provider, url))

    if (supported === undefined) throw new Error(`'${url}' protocol is not supported`)
  }

  return manifest
}

/**
 * @param {toa.origins.Manifest} manifest
 */
function validate (manifest) {
  manifest = remap(manifest, (value) => shards(value)[0])
  schemas.manifest.validate(manifest)

  Object.values(manifest).forEach(credentials.check)
}

function supports (provider, url) {
  return provider.protocols.findIndex((protocol) => url.substring(0, protocol.length) === protocol) !== -1
}

exports.manifest = manifest
