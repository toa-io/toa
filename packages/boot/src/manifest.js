'use strict'

const { Package } = require('@kookaburra/package')

const manifest = async (path) => {
  return Package.load(path)
}

exports.manifest = manifest
