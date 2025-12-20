'use strict'

const { directory: { find } } = require('@toa.io/filesystem')
const { resolve } = require('../shortcuts')

const cache = {}

const extensions = (manifest) => {
  if (manifest.extensions === undefined)
    manifest.extensions = PREDEFINED
  else
    manifest.extensions = Object.assign({}, PREDEFINED, manifest.extensions)

  const extensions = manifest.extensions

  for (let [reference, declaration] of Object.entries(extensions)) {
    let key = resolve(reference)

    // relative path
    if (key[0] === '.') key = find(key, manifest.path)

    cache[key] ??= require(key)
    const extension = cache[key]

    if (extension.manifest !== undefined) {
      declaration = extension.manifest(declaration, manifest)
    }
  }
}

const PREDEFINED = {
  '@toa.io/extensions.telemetry': null
}

exports.extensions = extensions
