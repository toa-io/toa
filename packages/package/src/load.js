'use strict'

const path = require('path')
const { yaml } = require('@kookaburra/gears')

const { operations } = require('./operations')
const { expand } = require('./expand')
const { validate } = require('./validate')

const load = async (root) => {
  const manifest = await yaml(path.resolve(root, MANIFEST))

  await operations(root, manifest)
  expand(manifest)

  const error = validate(manifest)

  if (error) throw new Error(error.message)

  return manifest
}

const MANIFEST = 'manifest.yaml'

exports.load = load
