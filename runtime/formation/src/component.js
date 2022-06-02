'use strict'

const { resolve } = require('path')
const glob = require('fast-glob')
const { yaml } = require('@toa.io/gears')
const { Locator } = require('@toa.io/core')

const { expand } = require('./component/expand')
const { merge } = require('./component/merge')
const { validate } = require('./component/validate')
const { collapse } = require('./component/collapse')
const { dereference } = require('./component/dereference')
const { defaults } = require('./component/defaults')
const { normalize } = require('./component/normalize')
const { lookup } = require('./lookup')

const component = async (reference, base) => {
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
  manifest.locator = new Locator(manifest)

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

  return await Promise.all(paths.map(component))
}

const MANIFEST = 'manifest.toa.yaml'

exports.component = component
exports.find = find
