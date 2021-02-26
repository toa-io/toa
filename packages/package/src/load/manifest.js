'use strict'

const { yaml } = require('@kookaburra/gears')

const { check } = require('./manifest/check')

async function manifest (path) {
  const manifest = await yaml(path)

  check(manifest)

  return manifest
}

exports.manifest = manifest
