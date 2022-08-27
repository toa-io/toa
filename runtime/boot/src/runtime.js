'use strict'

const { remap } = require('@toa.io/libraries/generic')
const { Runtime, Locator, State, entities } = require('@toa.io/core')
const { Schema } = require('@toa.io/libraries/schema')

const boot = require('./index')

/**
 * @param {toa.norm.Component} component
 * @returns {Promise<toa.core.Runtime>}
 */
const runtime = async (component) => {
  const locator = new Locator(component.name, component.namespace)
  const storage = boot.storage(locator, component.entity.storage)
  const context = await boot.context(component)
  const emission = boot.emission(component.events, locator)
  const schema = new Schema(component.entity.schema)
  const entity = new entities.Factory(schema)
  const state = new State(storage, entity, emission, component.entity.initialized)

  const operations = remap(component.operations, (definition, endpoint) =>
    boot.operation(component, endpoint, definition, context, state))

  const runtime = new Runtime(locator, operations)

  if (storage) runtime.depends(storage)
  if (emission) runtime.depends(emission)

  return runtime
}

exports.runtime = runtime
