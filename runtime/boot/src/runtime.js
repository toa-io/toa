'use strict'

const { remap } = require('@toa.io/libraries/generic')
const { Runtime, Locator } = require('@toa.io/core')

const boot = require('./index')

const runtime = async (manifest) => {
  const locator = new Locator(manifest)
  const storage = boot.storage(locator, manifest.entity.storage)
  const context = await boot.context(manifest)
  const emission = boot.emission(manifest.events, locator)

  const operations = remap(manifest.operations, (definition, endpoint) =>
    boot.operation(manifest, endpoint, definition, context, storage, emission))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (emission) runtime.depends(emission)

  return runtime
}

exports.runtime = runtime
