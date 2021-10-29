'use strict'

const { resolve } = require('path')
const { lookup, yaml } = require('@toa.io/gears')

const { expand } = require('./expand')
const { merge } = require('./merge')
const { validate } = require('./validate')
const { collapse } = require('./collapse')
const { dereference } = require('./dereference')
const { defaults } = require('./defaults')
const { normalize } = require('./normalize')

const manifest = async (reference, base = process.cwd()) => {
  const manifest = await load(reference, base)

  normalize(manifest)
  validate(manifest)

  return manifest
}

const load = async (reference, base) => {
  const root = lookup.directory(reference, base)
  const path = resolve(root, MANIFEST)

  const manifest = await yaml(path)

  manifest.path = root

  expand(manifest)
  defaults(manifest)

  await merge(root, manifest)

  if (manifest.prototype !== null) {
    const prototype = await load(manifest.prototype, root)

    collapse(manifest, prototype, root)
  }

  dereference(manifest)

  return manifest
}

const MANIFEST = 'manifest.toa.yaml'

exports.load = manifest
