'use strict'

const { Component, Locator, State, entities } = require('@toa.io/core')
const schemas = require('@toa.io/schemas')

const boot = require('./index')
const { span } = require('./span')

const component = async (manifest) => {
  const locator = new Locator(manifest.name, manifest.namespace)

  return span(`component ${locator.id}`, () => create(manifest, locator))
}

const create = async (manifest, locator) => {
  boot.extensions.load(manifest)
  const storage = boot.storage(manifest)
  const context = await boot.context(manifest)
  const emission = boot.emission(manifest.events, locator, context)

  let state

  if (manifest.entity !== undefined) {
    const schema = schemas.schema(manifest.entity.schema)
    const guards = await boot.guards(manifest, context)
    const entity = new entities.Factory(schema, guards)

    state = new State(storage, entity, emission, manifest.entity.associated)
  }

  const phases = await boot.rc(manifest, context)
  const operations = await bootOperations(manifest, context, state, phases?.preflight)
  const component = new Component(locator, operations)

  if (storage) component.depends(storage)
  if (emission) component.depends(emission)

  const decorated = boot.extensions.component(component)

  if (phases?.settle !== undefined)
    decorated.settle = phases.settle

  return decorated
}

async function bootOperations (manifest, context, state, preflight) {
  if (manifest.operations === undefined)
    return {}

  const operations = {}

  for (const [endpoint, definition] of Object.entries(manifest.operations))
    operations[endpoint] = await boot.operation(manifest, endpoint, definition, context, state, preflight)

  return operations
}

exports.component = component
