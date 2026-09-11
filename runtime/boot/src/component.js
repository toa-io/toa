import { Component, Locator, State, entities } from '@toa.io/core'
import { entity as declaration } from '@toa.io/norm'
import { schema as compileSchema } from '@toa.io/schemas'
import { environment } from '@toa.io/generic'

import * as boot from './index.js'
import { span } from './span.js'

export const component = async (manifest) => {
  const locator = new Locator(manifest.name, manifest.namespace)

  return span(`component ${locator.id}`, () => create(manifest, locator))
}

const create = async (manifest, locator) => {
  // what a test set after this package loaded goes to the store now, before a module of the
  // component is imported: nothing of it is left in `process.env` for that module to read
  environment.absorb()

  await boot.extensions.load(manifest)

  // the storage is told whether there will be an outbox, so what it publishes to comes first:
  // its own events, and whatever an extension adds
  const events = boot.events(manifest)
  const destinations = await boot.extensions.destinations(manifest)
  const storage = await boot.storage(
    manifest,
    events !== undefined || destinations.length > 0,
    boot.inbox(manifest)
  )
  const context = await boot.context(manifest)
  const emission = await boot.emission(events, locator, context)
  const outbox = boot.outbox(manifest, storage, emission, destinations)

  let state

  if (manifest.entity !== undefined) {
    const schemas = compile(manifest.entity)
    const guards = await boot.guards(manifest, context)
    const blank = manifest.entity.blank ?? {}

    // fitted here rather than where the first record is written, so a component that
    // declares a blank nothing can hold does not boot
    const error = schemas.changeset.fit(blank)

    if (error !== null)
      throw new Error(`Component '${locator.id}' entity blank: ${error.message}`)

    state = new State(
      storage,
      new entities.Factory(schemas, blank, guards),
      outbox,
      manifest.entity.associated
    )
  }

  const phases = await boot.rc(manifest, context)
  const operations = await bootOperations(manifest, context, state, phases?.preflight)
  const component = new Component(locator, operations)

  if (storage) component.depends(storage)

  // the outbox owns the emission and the storage, so it drains before either goes down
  if (outbox) component.depends(outbox)
  else if (emission) component.depends(emission)

  const decorated = boot.extensions.component(component)

  if (phases?.settle !== undefined) decorated.settle = phases.settle

  if (phases?.ready !== undefined) decorated.ready = phases.ready

  // a dependency closes after its dependant, so the component is already closed
  // when the RC releases what it opened
  if (phases?.dispose !== undefined) decorated.depends(phases.dispose)

  return decorated
}

async function bootOperations(manifest, context, state, preflight) {
  if (manifest.operations === undefined) return {}

  const entries = Object.entries(manifest.operations)

  // each one loads its algorithm from disk and compiles its contracts
  const booted = await Promise.all(
    entries.map(([endpoint, definition]) =>
      boot.operation(manifest, endpoint, definition, context, state, preflight)
    )
  )

  const operations = {}

  for (let i = 0; i < entries.length; i++) operations[entries[i][0]] = booted[i]

  return operations
}

/** What a stored record must fit, and what a changeset may. */
const compile = (entity) => ({
  entity: compileSchema(declaration.schema(entity)),
  changeset: compileSchema(declaration.changeset(entity))
})
