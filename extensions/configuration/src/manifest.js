'use strict'

const { validate } = require('./.manifest')

const manifest = (declaration) => {
  validate(declaration)

  return declaration
}

exports.manifest = manifest
