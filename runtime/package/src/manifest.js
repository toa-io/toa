'use strict'

const { resolve } = require('path')
const { yaml } = require('@kookaburra/gears')

const { find } = require('./find')
const { expand } = require('./expand')
const { operations } = require('./operations')
const { validate } = require('./validate')
const { collapse } = require('./collapse')
const { dereference } = require('./dereference')

const manifest = async (reference, base) => {
  const manifest = await load(reference, base)

  validate(manifest)

  return manifest
}

const load = async (reference, base) => {
  const root = find(reference, base)
  const path = resolve(root, MANIFEST)

  const manifest = await yaml(path)

  await operations(root, manifest)

  expand(manifest)

  if (manifest.prototype === undefined) manifest.prototype = ORIGIN

  if (manifest.prototype !== null) {
    if (!manifest.prototype) manifest.prototype = ORIGIN

    const prototype = await load(manifest.prototype, root)

    collapse(manifest, prototype, root)
  }

  dereference(manifest)

  return manifest
}

const MANIFEST = 'manifest.yaml'
const ORIGIN = '@kookaburra/prototype'

exports.load = manifest
