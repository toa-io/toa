'use strict'

const { resolve } = require('path')
const glob = require('fast-glob')
const { yaml } = require('@toa.io/gears')

const { expand } = require('./manifest/expand')
const { merge } = require('./manifest/merge')
const { validate } = require('./manifest/validate')
const { collapse } = require('./manifest/collapse')
const { dereference } = require('./manifest/dereference')
const { defaults } = require('./manifest/defaults')
const { normalize } = require('./manifest/normalize')
const { lookup } = require('./manifest/lookup')

const manifest = async (reference, base) => {
  const manifest = await load(reference, base)

  normalize(manifest)
  validate(manifest)

  return manifest
}

const load = async (reference, base) => {
  const root = lookup(reference, base)
  const path = resolve(root, MANIFEST)
  const manifest = await yaml(path)

  manifest.path = root

  defaults(manifest)
  expand(manifest)

  await merge(root, manifest)

  if (manifest.prototype !== null) {
    const prototype = await load(manifest.prototype, root)

    collapse(manifest, prototype, root)
  }

  dereference(manifest)

  return manifest
}

const find = async (pattern) => {
  const paths = await glob(pattern, { onlyDirectories: true, absolute: true })

  return await Promise.all(paths.map(manifest))
}

const MANIFEST = 'manifest.toa.yaml'

exports.manifest = manifest
exports.find = find
