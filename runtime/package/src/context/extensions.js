'use strict'

const { describe } = require('./describe')

const extensions = (context) => {
  const extensions = {}

  for (const manifest of context.manifests) {
    if (manifest.extensions !== undefined) {
      for (const extension of Object.keys(manifest.extensions)) {
        if (extensions[extension] === undefined) extensions[extension] = []

        extensions[extension].push(describe(manifest))
      }
    }
  }

  return extensions
}

exports.extensions = extensions
