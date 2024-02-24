'use strict'

function version (manifest) {
  if (manifest.version === undefined) {
    const bridge = require(manifest.bridge)

    if ('version' in bridge)
      manifest.version = bridge.version(manifest)
  }

  if (manifest.version === undefined) {
    console.warn(`Component '${manifest.namespace ? manifest.namespace + '.' : ''}${manifest.name}' has no version`)

    manifest.version = Math.random().toString(36).slice(2)
  }

}

exports.version = version
