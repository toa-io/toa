'use strict'

const { load } = require('@kookaburra/package')
const { Runtime, Locator } = require('@kookaburra/core')

const boot = require('./index')

const runtime = async (path) => {
  const manifest = await load(path)
  const locator = new Locator(manifest)
  const storage = boot.storage(locator, manifest.entity.storage)
  const context = boot.context(manifest.remotes)
  const emission = boot.emission(manifest, locator)

  manifest.path = path

  const operations = Object.fromEntries(manifest.operations.map((declaration) => {
    // TODO: move mapping to Runtime
    const operation = boot.operation(manifest, declaration, context, storage, emission)

    return [declaration.name, operation]
  }))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (emission) runtime.depends(emission)

  return runtime
}

exports.runtime = runtime
