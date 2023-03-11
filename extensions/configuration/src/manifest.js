'use strict'

const { normalize, validate } = require('./.manifest')

const manifest = (manifest) => {
  const declaration = normalize(manifest)

  validate(declaration)

  return declaration
}

exports.manifest = manifest
