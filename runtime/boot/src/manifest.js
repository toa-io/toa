'use strict'

const { component: load } = require('@toa.io/norm')
const { Locator } = require('@toa.io/core')

/**
 * @type {toa.boot.Manifest}
 */
const manifest = async (path, options) => {
  const manifest = await load(path)

  if (options?.bindings !== undefined) {
    for (const operation of Object.values(manifest.operations)) {
      operation.bindings = options.bindings
    }

    const check = (binding) => require(binding).properties?.async === true
    const mediator = options.bindings.find(check)

    if (mediator === undefined) throw new Error('Bindings override must contain at least one async binding')

    for (const event of Object.values(manifest.events)) {
      event.binding = mediator
    }
  }

  manifest.locator = new Locator(manifest.name, manifest.namespace)

  return manifest
}

exports.manifest = manifest
