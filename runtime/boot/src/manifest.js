'use strict'

const { load } = require('@kookaburra/package')
const { Locator } = require('@kookaburra/core')

const manifest = async (path, options) => {
  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      operation.bindings = options.bindings
    }
  }

  manifest.locator = new Locator(manifest)

  return manifest
}

exports.manifest = manifest
