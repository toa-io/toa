'use strict'

const { remap } = require('@kookaburra/gears')
const { Runtime, Locator } = require('@kookaburra/core')

const boot = require('./index')

const runtime = async (manifest) => {
  const locator = new Locator(manifest)
  const storage = boot.storage(locator, manifest.entity.storage)
  const emission = boot.emission(manifest.events, locator)
  const context = await boot.context(manifest)

  // const receivers = await Promise.all(remap(manifest.receivers, (definition, label) =>
  //   boot.receiver(label, definition, discovery, context.local)))

  const operations = remap(manifest.operations, (definition, endpoint) =>
    boot.operation(manifest, endpoint, definition, context, storage, emission))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (emission) runtime.depends(emission)

  return runtime
}

exports.runtime = runtime
