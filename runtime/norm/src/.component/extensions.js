'use strict'

const { directory: { find } } = require('@toa.io/filesystem')
const { resolve } = require('../shortcuts')

const extensions = (manifest) => {
  if (manifest.extensions === undefined)
    manifest.extensions = PREDEFINED
  else
    Object.assign({}, PREDEFINED, manifest.extensions)

  const extensions = manifest.extensions

  for (let [reference, declaration] of Object.entries(extensions)) {
    let key = resolve(reference)

    // relative path
    if (key[0] === '.') key = find(key, manifest.path)

    const extension = require(key)

    if (extension.manifest !== undefined) {
      declaration = extension.manifest(declaration, manifest)

      if (declaration === undefined) throw new Error(`Extension '${reference}' hasn't returned manifest`)
    }

    extensions[key] = declaration

    // shortcut was used
    if (reference !== key) delete extensions[reference]
  }
}

const PREDEFINED = {
  '@toa.io/extensions.telemetry': null
}

exports.extensions = extensions
