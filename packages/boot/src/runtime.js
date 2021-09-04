'use strict'

const { Package } = require('@kookaburra/package')
const { Runtime } = require('@kookaburra/runtime')
const factories = require('./factories')

const runtime = async (path, options) => {
  const manifest = await Package.load(path)
  const locator = factories.locator(manifest)
  const storage = factories.storage(manifest.entity.storage, locator)

  const operations = Object.fromEntries(manifest.operations.map((descriptor) => {
    let operation

    if (options?.proxy) {
      operation = factories.invocation(descriptor, manifest.entity)
    } else {
      operation = factories.operation(manifest, locator, descriptor, storage)

      if (options?.mono) operation = factories.invocation(descriptor, manifest.entity, operation)
    }

    return [descriptor.name, operation]
  }))

  const runtime = new Runtime(locator, operations)

  if (storage) { runtime.depends(storage) }

  return runtime
}

exports.runtime = runtime
