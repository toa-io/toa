'use strict'

const { remap } = require('@toa.io/libraries/generic')
const { Runtime, Locator } = require('@toa.io/core')

const boot = require('./index')

const runtime = async (component) => {
  const locator = new Locator(component.name, component.namespace)
  const storage = boot.storage(locator, component.entity.storage)
  const context = await boot.context(component)
  const emission = boot.emission(component.events, locator)

  const operations = remap(component.operations, (definition, endpoint) =>
    boot.operation(component, endpoint, definition, context, storage, emission))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (emission) runtime.depends(emission)

  return runtime
}

exports.runtime = runtime
