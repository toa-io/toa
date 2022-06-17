'use strict'

const { recognize, lookup } = require('../../lookup')

function extensions (manifest) {
  recognize(manifest, 'extensions')

  if (manifest.extensions === undefined) return

  for (const [key, value] of Object.entries(manifest.extensions)) {
    const path = lookup(key, manifest.path)

    manifest.extensions[path] = value
    delete manifest.extensions[key]
  }
}

exports.extensions = extensions
