'use strict'

const { resolve } = require('../../lookup')

/**
 * @param {toa.formation.Component} manifest
 */
const extensions = (manifest) => {
  if (manifest.extensions === undefined) return

  const extensions = manifest.extensions

  for (let [reference, declaration] of Object.entries(extensions)) {
    const path = resolve(reference, manifest.path)
    const extension = require(path)

    if (extension.manifest !== undefined) {
      declaration = extension.manifest(declaration, manifest)

      if (declaration === undefined) throw new Error(`Extension '${reference}' didn't return manifest`)
    }

    extensions[path] = declaration

    // relative references
    if (reference !== path) delete extensions[reference]
  }
}

exports.extensions = extensions
