'use strict'

const { normalize, validate } = require('./.manifest')

const manifest = (declaration) => {
  declaration = normalize(declaration)

  validate(declaration)

  return declaration
}

exports.manifest = manifest
