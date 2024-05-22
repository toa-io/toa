'use strict'

const { join } = require('node:path')

const { load: yaml } = require('@toa.io/yaml')
const { directory: { find } } = require('@toa.io/filesystem')
const { Locator } = require('@toa.io/core')

const {
  expand,
  merge,
  validate,
  collapse,
  dereference,
  defaults,
  normalize,
  extensions
} = require('./.component')

const component = async (path) => {
  const manifest = await load(path)

  normalize(manifest, path)
  validate(manifest)
  extensions(manifest)

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

const load = async (path, base, proto = false) => {
  if (base !== undefined) path = find(path, base, MANIFEST)

  const file = join(path, MANIFEST)
  const manifest = await yaml(file) ?? {}

  manifest.path = path

  defaults(manifest, proto)
  await expand(manifest)

  await merge(path, manifest)

  if (manifest.prototype !== null) {
    const prototype = await load(manifest.prototype, path, true)

    collapse(manifest, prototype)
  }

  dereference(manifest)
  // dependencies(manifest)

  return manifest
}

const MANIFEST = 'manifest.toa.yaml'

exports.component = component
