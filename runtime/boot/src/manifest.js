'use strict'

const { merge } = require('@toa.io/generic')
const { component: load } = require('@toa.io/norm')
const { Locator } = require('@toa.io/core')

/**
 * @type {toa.boot.Manifest}
 */
const manifest = async (path, options = {}) => {
  merge(options, DEFAULTS)

  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      operation.bindings = options.bindings
    }

    const check = (binding) => require(binding).properties?.async === true
    const asyncBinding = options.bindings.find(check)

    if (asyncBinding === undefined) throw new Error('Bindings override must contain at least one async binding')

    for (const event of Object.values(manifest.events)) event.binding = asyncBinding

    if (manifest.receivers) {
      for (const receiver of Object.values(manifest.receivers)) receiver.binding = asyncBinding
    }
  }

  if (!('extensions' in manifest)) manifest.extensions = {}

  for (const extension of options.extensions) {
    if (!(extension in manifest.extensions)) manifest.extensions[extension] = null
  }

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

const DEFAULTS = {
  extensions: ['@toa.io/extensions.sampling', '@toa.io/extensions.cache']
}

exports.manifest = manifest
