'use strict'

const { load } = require('@kookaburra/package')

const manifest = async (path, options) => {
  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      operation.bindings = options.bindings
    }
  }

  return manifest
}

exports.manifest = manifest
