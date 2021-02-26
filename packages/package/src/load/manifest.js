'use strict'

const { yaml } = require('@kookaburra/gears')

async function manifest (path) {
  return await yaml(path)
}

exports.manifest = manifest
