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
  const outbox = boot.outbox(manifest, storage, emission)

  let state

  if (manifest.entity !== undefined) {
    const schema = schemas.schema(manifest.entity.schema)
    const guards = await boot.guards(manifest, context)
    const entity = new entities.Factory(schema, guards)

    state = new State(storage, entity, outbox, manifest.entity.associated)
  }

  const phases = await boot.rc(manifest, context)
  const operations = await bootOperations(manifest, context, state, phases?.preflight)
  const component = new Component(locator, operations)

  if (storage) component.depends(storage)

  // the outbox owns the emission and the storage, so it drains before either goes down
  if (outbox) component.depends(outbox)
  else if (emission) component.depends(emission)

  const decorated = boot.extensions.component(component)

  if (phases?.settle !== undefined)
    decorated.settle = phases.settle

  // a dependency closes after its dependant, so the component is already closed
  // when the RC releases what it opened
  if (phases?.dispose !== undefined)
    decorated.depends(phases.dispose)

  return decorated
}

async function bootOperations (manifest, context, state, preflight) {
  if (manifest.operations === undefined)
    return {}

  const entries = Object.entries(manifest.operations)

  // each one loads its algorithm from disk and compiles its contracts
  const booted = await Promise.all(entries.map(([endpoint, definition]) =>
    boot.operation(manifest, endpoint, definition, context, state, preflight)))

  const operations = {}

  for (let i = 0; i < entries.length; i++)
    operations[entries[i][0]] = booted[i]

  return operations
}

exports.component = component
