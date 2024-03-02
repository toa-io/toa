'use strict'

const clone = require('clone-deep')
const { merge } = require('@toa.io/generic')
const { component: load } = require('@toa.io/norm')
const { Locator } = require('@toa.io/core')

/**
 * @type {toa.boot.Manifest}
 */
const manifest = async (path, options = {}) => {
  options = merge(clone(options), DEFAULTS)

  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    if ('operations' in manifest) {
      for (const operation of Object.values(manifest.operations)) {
        operation.bindings = options.bindings
      }
    }

    const check = (binding) => require(binding).properties?.async === true
    const asyncBinding = options.bindings.find(check)

    if (asyncBinding === undefined) throw new Error('Bindings override must contain at least one async binding')

    if ('events' in manifest) {
      for (const event of Object.values(manifest.events)) event.binding = asyncBinding
    }

    if ('receivers' in manifest) {
      for (const receiver of Object.values(manifest.receivers)) {
        if (receiver.source === undefined) receiver.binding = asyncBinding
      }
    }
  }

  if (manifest.extensions === undefined) manifest.extensions = {}

  if (options.extensions !== undefined) {
    for (const extension of options.extensions) {
      if (!(extension in manifest.extensions)) manifest.extensions[extension] = null
    }
  }

  if ('storage' in options && 'entity' in manifest) manifest.entity.storage = options.storage

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

const DEFAULTS = {
  // extensions: ['@toa.io/extensions.sampling']
}

exports.manifest = manifest
