'use strict'

const { join } = require('node:path')
const extensions = require('./extensions')

const storage = (manifest) => {
  if (manifest.entity === undefined) return

  const Factory = load(manifest)

  /** @type {toa.core.storages.Factory} */
  const factory = new Factory()
  const storage = factory.storage(manifest.locator, manifest.entity)

  return extensions.storage(storage)
}

function load (component) {
  const reference = component.entity.storage
  const path = require.resolve(reference, { paths: [component.path, __dirname] })
  const { Factory } = require(path)

  return Factory
}

exports.storage = storage
