'use strict'

const { normalize, validate } = require('./.manifest')

const manifest = (node, manifest) => {
  normalize(node, manifest)
  validate(node)

  return node
}

exports.manifest = manifest
