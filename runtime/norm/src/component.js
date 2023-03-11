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
  normalize
} = require('./.component')

/**
 * @type {toa.norm.component.Constructor}
 */
const component = async (path) => {
  const manifest = await load(path)

  normalize(manifest, process.env.TOA_ENV)
  validate(manifest)

  return manifest
}

const load = async (path, base) => {
  if (base !== undefined) path = find(path, base, MANIFEST)

  const file = join(path, MANIFEST)
  const manifest = await yaml(file)

  manifest.path = path

  defaults(manifest)
  expand(manifest)

  await merge(path, manifest)

  if (manifest.prototype !== null) {
    manifest.locator = new Locator(manifest.name, manifest.namespace)

    const prototype = await load(manifest.prototype, path)

    collapse(manifest, prototype)
  }

  dereference(manifest)

  return manifest
}

const MANIFEST = 'manifest.toa.yaml'

exports.component = component
