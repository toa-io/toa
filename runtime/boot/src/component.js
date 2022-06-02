'use strict'

const { component: load } = require('@toa.io/formation')
const { Locator } = require('@toa.io/core')

const component = async (path, options) => {
  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      operation.bindings = options.bindings
    }
  }

  manifest.locator = new Locator(manifest)

  return manifest
}

exports.component = component
