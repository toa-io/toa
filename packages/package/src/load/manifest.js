'use strict'

const { yaml } = require('../yaml')

async function manifest (path) {
  return await yaml(path)
}

exports.manifest = manifest
