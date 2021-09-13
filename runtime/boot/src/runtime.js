'use strict'

const { load } = require('@kookaburra/package')
const { Runtime, Locator } = require('@kookaburra/core')

const boot = require('./index')

const runtime = async (path) => {
  const manifest = await load(path)
  const locator = new Locator(manifest)
  const storage = boot.storage(locator, manifest.entity.storage.connector)
  const context = boot.context(manifest)

  const operations = Object.fromEntries(manifest.operations.map((descriptor) => {
    const operation = boot.operation(manifest, locator, descriptor, storage, context)

    return [descriptor.name, operation]
  }))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (context) runtime.depends(context)

  return runtime
}

exports.runtime = runtime
